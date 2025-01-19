import { parse } from "path";
import db from "../db/connection.js";
import { resetPassword } from "./authcontroller.js";


export const getProfile = async (req, res) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
        const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
        const limit = 5;
        const offset = (page - 1) * limit;

        //fetch users porst into profilepage 
        const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [req.user.id, limit, offset]);

        const totalPostsResult = await db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [req.user.id]);
        const totalPosts = parseInt(totalPostsResult.rows[0].count);
        const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer


        res.render('myProfile', { user: user.rows[0], posts:  getPost.rows, currentPage: page, totalPages:totalPages});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


// Handle profile form submission (update the user's profile in the database)
export const updateProfile = async (req, res) => {
    const { firstname, lastname, gender, bio } = req.body;
    try {
        // Update user's profile details in the database
        await db.query(
            'UPDATE users SET firstname = $1, lastname = $2, gender = $3, bio = $4 WHERE id = $5',
            [firstname, lastname, gender, bio, req.user.id]
        );
        res.redirect('/myProfile'); // Redirect to the profile page after successful update
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

//get all post for newsfeed
export const getNewsfeed = async (req, res) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        //pagination of post into the newsfeed
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;
        const getPosts = await db.query(`
            SELECT posts.id AS post_id, posts.title, posts.content, posts.created_at, posts.user_id, 
                   users.firstname, users.lastname, 
                   json_agg(json_build_object(
                       'id', comments.id, 
                       'content', comments.content, 
                       'created_at', comments.created_at,
                       'user_id', comments.user_id,
                       'user', json_build_object('id', comment_users.id, 'firstname', comment_users.firstname, 'lastname', comment_users.lastname)
                   )) AS comments
            FROM posts 
            LEFT JOIN comments ON posts.id = comments.post_id 
            LEFT JOIN users ON posts.user_id = users.id
            LEFT JOIN users AS comment_users ON comments.user_id = comment_users.id
            GROUP BY posts.id, users.firstname, users.lastname 
            ORDER BY posts.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) FROM posts');// execute a SQL query to count the total number of rows in the 'posts' table
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


        res.render('homepage', {posts: getPosts.rows,
            currentPage: page, 
            totalPages: totalPages,
            user: user.rows[0]
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
                user: req.user
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
        const postResult = await db.query("SELECT posts.id, posts.user_id, posts.content, posts.created_at, posts.title, users.firstname, users.lastname  FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = $1", [userId]);
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