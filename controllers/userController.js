import { parse } from "path";
import db from "../db/connection.js";
import { resetPassword } from "./authcontroller.js";
import { get } from "http";
import { upload } from '../controllers/uploadProfile.js';


export const getProfile = async (req, res) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
        const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
        const limit = 5;
        const offset = (page - 1) * limit;

        //fetch users porst into profilepage 
        const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [req.user.id, limit, offset]);

        //fetch LOGGED USER followers and following 
        const followingCountResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follows.follower_id = $1 `, [req.user.id])
       const followerCountResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE follows.following_id = $1 `, [req.user.id])
    //    console.log(followerCountResult.rows[0].follower_count)
    //    console.log(followingCountResult.rows[0].following_count)
    //    console.log(getPost.rows)
        
        //fetch the follower names of the user from follows table reference on users table
        const followerName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.follower_id = users.id
            WHERE follows.following_id = $1`, [req.user.id])
            // console.log(followerName.rows[0]);
        
         //fetch the following names of the user from follows table reference on users table
         const followingName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.following_id = users.id
            WHERE follows.follower_id = $1`, [req.user.id])

        const totalPostsResult = await db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [req.user.id]);
        const totalPosts = parseInt(totalPostsResult.rows[0].count);
        const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer


        res.render('myProfile', { 
            user: user.rows[0], 
            posts:  getPost.rows, 
            currentPage: page, 
            totalPages:totalPages,
            followerName: followerName.rows,
            followingName: followingName.rows,
            followerCount: followerCountResult.rows[0].follower_count,
            followingCount: followingCountResult.rows[0].following_count
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};



//get all post for newsfeed
export const getNewsfeed = async (req, res) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        //pagination of post into the newsfeed
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;
        // check if "You Follow" filter is applied
        const onlyFollowed = req.query.filter === 'followed';

        const getPosts = await db.query(`
            SELECT posts.id AS post_id, posts.title, posts.content, posts.created_at, posts.image, posts.user_id, 
                   users.firstname, users.lastname, users.profile_pictures AS user_profile_picture, 
                   json_agg(json_build_object(
                       'id', comments.id, 
                       'content', comments.content, 
                       'created_at', comments.created_at,
                       'user_id', comments.user_id,
                       'user', json_build_object(
                           'id', comment_users.id, 
                           'firstname', comment_users.firstname, 
                           'lastname', comment_users.lastname, 
                           'profile_pictures', comment_users.profile_pictures
                       ),
                       'reply_count', (SELECT COUNT(*) FROM replies WHERE replies.comment_id = comments.id),
                       'replies', (SELECT json_agg(json_build_object(
                           'id', replies.id,
                           'content', replies.content,
                           'created_at', replies.created_at,
                           'user_id', replies.user_id,
                           'user', json_build_object(
                               'id', reply_users.id,
                               'firstname', reply_users.firstname,
                               'lastname', reply_users.lastname,
                               'profile_pictures', reply_users.profile_pictures
                           )
                       )) 
                       FROM replies 
                       LEFT JOIN users AS reply_users ON replies.user_id = reply_users.id
                       WHERE replies.comment_id = comments.id)
                   )) FILTER (WHERE comments.id IS NOT NULL) AS comments,
                   COUNT(comments.id) AS comment_count,
                   (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
                   (SELECT json_agg(json_build_object(
                       'id', users.id, 
                       'firstname', users.firstname, 
                       'lastname', users.lastname,
                       'profile_pictures', users.profile_pictures
                   )) 
                    FROM likes 
                    JOIN users ON likes.user_id = users.id 
                    WHERE likes.post_id = posts.id) AS likers,
                   EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = $3) AS liked,
                   EXISTS(SELECT 1 FROM follows WHERE follows.follower_id = $3 AND follows.following_id = posts.user_id) AS following,
                   (SELECT COUNT(*) FROM follows WHERE follows.following_id = posts.user_id) AS follower_count,
                   (SELECT COUNT(*) FROM follows WHERE follows.follower_id = posts.user_id) AS following_count
            FROM posts 
            LEFT JOIN comments ON posts.id = comments.post_id 
            LEFT JOIN users ON posts.user_id = users.id
            LEFT JOIN users AS comment_users ON comments.user_id = comment_users.id
            ${onlyFollowed ? 'JOIN follows ON follows.following_id = posts.user_id WHERE follows.follower_id = $3' : ''}
            GROUP BY posts.id, users.firstname, users.lastname, users.profile_pictures
            ORDER BY posts.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset, req.user.id]); //the onlyfollowed code line is filtering the post in newsfeed of logged users, it only shows the post of users they follow
        
        const countResult = await db.query(
            onlyFollowed ? `SELECT COUNT(*) FROM posts 
               JOIN follows ON follows.following_id = posts.user_id 
               WHERE follows.follower_id = $1`
            : `SELECT COUNT(*) FROM posts`, onlyFollowed ? [req.user.id] : []);// execute a SQL query to count the total number of rows in the 'posts' table

        const totalPosts = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalPosts / limit);

        // console.log(getPosts.rows[0].comments);
        const posts = getPosts.rows;

        // Fetch replies for each comment within posts
        // for (let post of posts) {
        //     if (post.comments && post.comments.length > 0) {
        //         for (let comment of post.comments) {
        //             const replies = await fetchReplies(comment.id, { page: 1, limit: 10 });
        //             comment.replies = replies;
        //         }
        //     }
        // }

        res.render('homepage', {
            posts: getPosts.rows,
            currentPage: page, 
            totalPages: totalPages,
            user: user.rows[0],
            filter: onlyFollowed ? 'followed' : 'public',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching newsfeed" });
    }
}
// Utility function for fetching replies
// const fetchReplies = async (commentId, { page = 1, limit = 10 }) => {
//     const offset = (page - 1) * limit;

//     try {
//         const result = await db.query(`
//             SELECT r.id, r.content, r.created_at, u.id AS user_id, u.firstname, u.lastname
//             FROM replies r
//             JOIN users u ON r.user_id = u.id
//             WHERE r.comment_id = $1
//             LIMIT $2 OFFSET $3
//         `, [commentId, limit, offset]);

//         return result.rows;
//     } catch (error) {
//         console.error(`Error fetching replies for comment ${commentId}:`, error);
//         return [];
//     }
// };

//get the userprofile page when their name is clicked in the newsfeed
export const getUserProfile = async(req, res) => {
    try {
        const userId = req.params.id;
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if(userResult.rows.length > 0) {
             const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
             const limit =  5;
             const offset = (page - 1) * limit;
             
             //fetch the following and followers of the user
             const followerResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = $1`, [userId]);
             const followingResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follower_id = $1`, [userId]);

             //fetch if the logged users followed the clicked users
             const isFollowing = await db.query(`SELECT EXISTS (SELECT 1 FROM follows WHERE follows.follower_id = $1 AND follows.following_id = $2)`, [req.user.id, userId])

             //fetch the follower names of the user from follows table reference on users table
             const followerName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.follower_id = users.id
                WHERE follows.following_id = $1`, [userId])
                // console.log(followerName.rows[0]);
            
             //fetch the following names of the user from follows table reference on users table
             const followingName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.following_id = users.id
                WHERE follows.follower_id = $1`, [userId])

        //fetch users porst into profilepage 
            const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset]);

            const totalPostsResult = await db.query('SELECT COUNT(*) AS total FROM posts WHERE user_id = $1', [userId]);
            const totalPosts = parseInt(totalPostsResult.rows[0].total, 10);
            const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer
        
            res.render('userProfile', {
                userClicked: userResult.rows[0],
                posts: getPost.rows,
                currentPage: page, 
                totalPages:totalPages,
                user: req.user,
                followerCount: followerResult.rows[0].follower_count,
                followingCount: followingResult.rows[0].following_count,
                followerName: followerName.rows,
                followingName: followingName.rows,
                isFollowing: isFollowing.rows[0].exists    
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading post');
    }
}


//get user post if the post was clicked 
export const getUserPost = async(req, res) => {
    try {
        const userId = req.params.id;
        const postResult = await db.query("SELECT posts.id, posts.user_id, posts.content, posts.created_at, posts.title, posts.image, users.firstname, users.lastname, users.profile_pictures FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = $1", [userId]);
        const post = postResult.rows[0];

        if(postResult.rows.length > 0) {
            res.render('post', {post: post,
                user: req.user}
            );
        } else {
            return res.status(404).render('404', { message: 'Post not found' });
        }
  
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading post');
    }
}