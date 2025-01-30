// routes/authRoutes.js
import express, { response } from 'express';
import { signup } from '../controllers/authcontroller.js';
import passport from "passport";
import db from "../db/connection.js";
import { checkProfileCompletion } from '../middleware/profilecompletion.js';
import { updateProfile } from '../controllers/authcontroller.js';
import { getNewsfeed, getProfile, getUserProfile, getUserPost } from '../controllers/userController.js';
import { createPost } from '../controllers/createPost.js';
import {upload, uploadPicture} from '../controllers/uploadProfile.js';
import { error } from 'console';


const router = express.Router();

router.get('/verify-email', async (req, res) => {
    const {token} = req.query; //this query came from sendVerification function  http://localhost:3000/verify-email?token=${verificationToken}`, 

    try {
        //find the user with the verification token 
        const result = await db.query("SELECT * FROM users WHERE verification_token = $1 AND token_expiry > NOW()", [token]);

        if(result.rows.length === 0) {
            return res.status(400).send('Invalid or expired verification link');
        }

        //update users data with token to mark them verified
        const user = result.rows[0];
        await db.query("UPDATE users SET verified = true, verification_token = NULL, token_expiry = NULL WHERE id = $1", [user.id]); 
        //if token exist then it will verify users and make the verified boolean into false and remove the token in the column "verification_token"
        res.send(`Verification success! You can now log in using yourd gmail!`);

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during verification');
    }
})

// route for the newsfeed page (for users with completed profiles)
router.get('/homepage',checkProfileCompletion, getNewsfeed, async (req, res) => {
    const user = req.user;
    if(!req.isAuthenticated()) {
        res.redirect('/login');  // Redirect if user is not logged in
    }
});

 router.get('/login', (req, res) => {
    if(req.isAuthenticated()) {
        const user = req.user;
        res.redirect('/homepage')
    } else {
        res.render('login', {errorMessage: req.flash('error')});
    }
 })

// router.get('/log', (req, res) => {
//     if(req.isAuthenticated()) {
//         const user = req.user;
//         res.render('homepage', {user: user});
//     } else {
//         res.render('login', {errorMessage: req.flash('error')});
//     }
// });

router.post('/logOut', (req,res) => {
    req.logout(err => {
        if(err) {
            console.error(err);
        }
        res.redirect('/login');
    })
})

router.get('/forgotPassword', (req, res) => {
    res.render('forgetpassword');
})

// router.get('/profile', checkProfileCompletion, getProfile, (req, res) => {
//     if(!req.isAuthenticated()) {
//         res.redirect('/login');
//     }
    
// });

// router.post('/edit-profile', updateProfile);
router.post('/publish',uploadPicture.single('image'), async(req, res, next) => {
    if(req.fileValidationError) {
        res.render('newstory', {
            user: req.user,
            error: req.fileValidationError,  // pass error message to EJS template
        });
    }
    try {
        await createPost(req, res);
    } catch (error) {
        next(error);
    }
}, (error, req, res, next) => {
    return res.render('newstory', {
        user: req.user,
        error: error.message || 'File too large! upload a file smaller than 5mb',  // pass error message to EJS template
    }); 
})

// route to handle profile form submissions
router.post('/edit-profile',upload.single('profilePicture'), async(req, res, next) => {
    if (req.fileValidationError) {
        // if error occurs during file upload, render the profile page with error message
        return res.render('profile', {
            error: req.fileValidationError,  // pass error message to EJS template
            user: req.user
        });   
    }
    try {
        await updateProfile(req, res);
    } catch (error) {
        next(error);
    }
}, (error, req, res, next) => {
    return res.render('profile', {
        error: error.message || 'File too large! upload a file smaller than 5mb',  // pass error message to EJS template
        user: req.user
    }); 
});

router.get('/about', (req, res) => {
    if(!req.isAuthenticated()) {
        res.render('about');
    } else {
        res.redirect('/homepage'); 
    }
})

router.get('/landingpage', async(req, res) => {
    const user = req.user;
    if(req.isAuthenticated()) {
        res.redirect('/homepage');     
    } else {
        res.render('landingpage');
    }
})


router.post('/signup', signup); // Handle sign-up request


router.post('/log', passport.authenticate('local', {
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: true
})); // Handle login request


router.get('/myProfile', checkProfileCompletion, getProfile, async(req, res) =>{
    if(!req.isAuthenticated()) {
        res.redirect('/login'); //if user is not authenticated it will redirect them into log-in page
    }
    try {
        //fetch user details from database
        const user = req.user;
        res.render('myProfile', {user: user});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
//     In this route:
// checkProfileCompletion will ensure that the user’s profile is complete.
// req.user contains the user object, using passport.js and it's serializing the user to the session.
})


router.get('/myProfile/Bio', checkProfileCompletion, async(req, res) =>{
    if(!req.isAuthenticated()) {
        res.redirect('/login'); //if user is not authenticated it will redirect them into log-in page
    }
    try {
        //fetch user details from database
        //fetch the following and followers of the user
        const followerResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = $1`, [req.user.id]);
        const followingResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follower_id = $1`, [req.user.id]);

        //fetch the follower names of the user from follows table reference on users table
        const followerName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.follower_id = users.id
           WHERE follows.following_id = $1`, [req.user.id])
           // console.log(followerName.rows[0]);

        //fetch LOGGED USER followers and following 
        const followingCountResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follows.follower_id = $1 `, [req.user.id])
       const followerCountResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE follows.following_id = $1 `, [req.user.id])
       
        //fetch the following names of the user from follows table reference on users table
        const followingName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.following_id = users.id
           WHERE follows.follower_id = $1`, [req.user.id])
        const user = req.user;
        res.render('bio', {user,
            follower: followerResult.rows[0].follower_count,
            following: followingResult.rows[0].following_count,
            followerName: followerName.rows,
            followingName: followingName.rows,
            followerCount: followerCountResult.rows[0].follower_count,
            followingCount: followingCountResult.rows[0].following_count  
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
})


router.get('/edit-profile', async(req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect('/login');  
    }
    res.render('profile', { user: req.user });  // Render the edit profile form
})

//get post if user clicks the title of the post in newsfeed
router.get('/post/:id', getUserPost);



router.get('/user/:id', getUserProfile);
//get the user profile page when clicked the username in newsfeed 


router.get('/userBio/:id', async(req, res) => { //to get the userbio if the users visit into someone's profile and click the bio
    try {
        const userId = req.params.id;
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if(userResult.rows.length > 0) {
             const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
             const limit = parseInt(req.query.limit) || 5;
             const offset = (page - 1) * limit;

             //fetch the users follower and following
             const followerResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = $1`, [userId]);
             const followingResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follower_id = $1`, [userId]);

            //fetch the follower names of the user from follows table reference on users table
            const followerName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.follower_id = users.id
                WHERE follows.following_id = $1`, [userId])
            // console.log(followerName.rows[0]);

            //fetch LOGGED USER followers and following 
            const followingCountResult = await db.query(`SELECT COUNT(*) AS following_count FROM follows WHERE follows.follower_id = $1 `, [userId])
            const followerCountResult = await db.query(`SELECT COUNT(*) AS follower_count FROM follows WHERE follows.following_id = $1 `, [userId])
       
            //fetch the following names of the user from follows table reference on users table
            const followingName = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN users ON follows.following_id = users.id
                WHERE follows.follower_id = $1`, [userId])

            //fetch users porst into profilepage 
            const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset]);

            const totalPostsResult = await db.query('SELECT COUNT(*) AS total FROM posts WHERE user_id = $1', [userId]);
            const totalPosts = parseInt(totalPostsResult.rows[0].total);
            const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer
        
            if(totalPostsResult.rows.length > 0) {
                
                res.render('userBio', {
                    userClicked: userResult.rows[0],
                    user: req.user,
                    follower: followerResult.rows[0].follower_count,
                    following: followingResult.rows[0].following_count,
                    followerName: followerName.rows,
                    followingName: followingName.rows,
                    followerCount: followerCountResult.rows[0].follower_count,
                    followingCount: followingCountResult.rows[0].following_count  
                });
            } else {
                return res.status(404).render('404', { message: 'Profile not found' });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading post');
    }
})


router.get('/api/posts/:id', async(req, res) => { //to enable the readmore toggle in the newsfeed and profilepage
    try {
        const postId = req.params.id;
        const postResult = await db.query("SELECT * FROM posts WHERE id = $1", [postId]);

        if(postResult.rows.length > 0) {
            res.json(postResult.rows[0]);
        }
    } catch (error) {
        
    }
})



router.post('/posts/:id', async (req, res) => { //to update a data of user into the databse
    const { id } = req.params;
    const { title, content } = req.body;

    try {
        const result = await db.query(
            'UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING id',
            [title, content, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send('Post not found');
        }

        res.redirect('/myProfile'); // Redirect to the profile page after update
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating post');
    }
});

router.delete('/delete/posts/:id', async(req, res) => {
    const postId = req.params.id;
    try {
        // SQL query to delete the post with the given ID
        const result = await db.query('DELETE FROM posts WHERE id = $1 RETURNING *', [postId]);
        // console.log(result.rows.length);
    
        if (result.rows.length === 0) {
          return res.status(404).send({ message: 'Post not found' });
        }
        res.send({ message: 'Post deleted' }); // Return a success message
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while deleting the post' });
      }
});

router.post('/api/posts/:id/comments', async (req, res) => { //to fetch comments in a specific from database into newsfeed and userprofile
    const postId = req.params.id;
    const userId = req.user.id; // Assume logged-in user ID is in req.user
    const { content } = req.body;
  
    if (!content) {
      return res.status(400).send({ message: 'Comment content cannot be empty' });
    }
  
    try {
      const result = await db.query(
        'INSERT INTO comments (post_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [postId, userId, content]
      );

      const totalResult = await db.query(
        'SELECT COUNT(*) AS total FROM replies WHERE comment_id = $1',
        [postId]
    );
    // console.log(totalResult.rows[0].total);
  
      const newComment = result.rows[0];
      const userResult = await db.query('SELECT id, firstname, lastname, profile_pictures FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0];
      const totalReplies = totalResult.rows[0].total;
  
      res.status(201).send({ ...newComment, user, totalReplies });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).send({ message: 'Error adding comment' });
    }
  });

  
  
  router.post('/api/comments/:id/get/replies', async (req, res) => { //insert the replies into replies table in db
    const commentId = req.params.id; // id of the comment being replied to
    const userId = req.user.id; // logged-in user id from req.user
    const { content } = req.body; // content of the reply
  
    if (!content) {
      return res.status(400).send({ message: 'Reply content cannot be empty' });
    }
  
    try {
      // insert the reply into the database
      const result = await db.query(
        'INSERT INTO replies (comment_id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [commentId, userId, content]
      );

  
      const newReply = result.rows[0];
    //   console.log(newReply);
  
      // fetch user details
      const userResult = await db.query('SELECT id, firstname, lastname, profile_pictures FROM users WHERE id = $1', [userId]);
      const userData = userResult.rows[0];
  
      // combine reply and user details
      res.status(201).send({
        ...newReply, userData,
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).send({ message: 'Error adding reply' });
    }
  });


  router.get('/api/comments/:id/replies', async (req, res) => {

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const commentId = req.params.id;
    const page = parseInt(req.query.page) || 1; // Get the current page (default to 1)
    const pageSize = 5; // Number of replies to load per request
    const offset = (page - 1) * pageSize;
  
    try {
        // query to fetch replies for the specific comment
        const result = await db.query(`SELECT r.id, r.content, r.created_at, u.id AS user_id, u.firstname, u.lastname, u.profile_pictures
            FROM replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.comment_id = $1
            LIMIT $2 OFFSET $3`,
            [commentId, pageSize, offset]
        );

        const replies = result.rows;

        // get the total number of replies to determine if there are more replies to load
        const totalResult = await db.query(
            'SELECT COUNT(*) AS total FROM replies WHERE comment_id = $1',
            [commentId]
        );
        
        const totalReplies = totalResult.rows[0].total;
        const totalPages = Math.ceil(totalReplies / pageSize);

        // Determine if more pages are available
        const hasMoreReplies = totalReplies < pageSize;

        // console.log(`total replies ${totalReplies}`);
        // console.log(`total page ${totalPages}`);
        
        // send the fetched replies as a response
        res.json({
            replies: replies,
            totalReplies: totalReplies,
            totalPages: totalPages,
            currentPage: page,
            hasMoreReplies: hasMoreReplies
        });


    } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).send({ message: 'Error fetching replies' });
    }

});

// post /api/posts/:id/like
router.post('/api/posts/:id/like', async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id; 
  
    try {
      //check if the user already liked the post
      const existingLike = await db.query(
        'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );
      //get the count of likes for the post
      const likeCountResult = await db.query(
        'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = $1',
        [postId]);

        const likeCount = likeCountResult.rows[0].like_count;
  
      if (existingLike.rows.length > 0) {
        // unlike the post if already liked
        await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [
          postId,
          userId,
        ]);

        //get the count of likes for the post
        const likeCountResult = await db.query(
        'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = $1',
        [postId]);

        const likeCount = likeCountResult.rows[0].like_count;
        res.status(200).json({ liked: false, like_count: likeCount });
      } else {
        // like the post
        await db.query(
          'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
          [postId, userId]
        );

        //get the count of likes for the post
        const likeCountResult = await db.query(
            'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = $1',
            [postId]);
    
        const likeCount = likeCountResult.rows[0].like_count;
        res.status(200).json({ liked: true, like_count: likeCount, userId: userId });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'Error toggling like' });
    }
  });
  
router.post('/api/users/:id/follow', async(req, res) => { //route for follow/unfollow
    const userId = req.user.id //current logged in user
    const targetUserId = req.params.id //users to follow/unfollow

    try {//check if the logged user already followed the target user
        const existingUser = await db.query(`SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2`,
            [userId, targetUserId]
        );
        if(existingUser.rows.length > 0){
            await db.query('DELETE from follows WHERE follower_id = $1 AND following_id = $2',
                [userId, targetUserId] //unfollow the target user
            );
            res.status(200).json({following: false});
        } else {
            //follow target user 
            await db.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
                [userId, targetUserId]
            );
            res.status(200).json({following: true})
        }

    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ message: 'Error toggling follow' });
    }
  })

  router.get('/api/user/follow-count/:id', async(req, res) => {
    //Retrieve Followers Count and Following Count
    const userId = req.params.id;
    try {
        const user = await db.query(
            `SELECT COUNT(*) FROM follows WHERE following_id = $1 AS following_count, 
            SELECT COUNT(*) FROM follows WHERE follower_id = $1 AS follower_count FROM users WHERE id = $1`,
            [userId]
        );
        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }

  })
  router.get('/api/users-followers-name/:id', async(req, res) => { //fetch the followers of the user from databse
    const userId = req.params.id;
    try {
        const followers = await db.query(`SELECT users.id, users.firstname, users.lastname FROM follows JOIN ON users ON follows.followers_id = users.id
            WHERE follows.following_id = $1`, [userId])
        res.status(200).json(followers.rows);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Error fetching followers' });
    }

  }) 

  router.get('/api/users-following-name/:id', async(req, res) => { //fetch the following of the user from databse
    const userId = req.params.id;
    try {
        const following = await db.query(`
            SELECT users.id, users.firstname, users.lastname FROM follows
            JOIN ON users ON follows ON follows.following_id = user.id WHERE follows.follower_id = $1`, 
            [userId]);
        res.status(200).json(following.rows);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Error fetching followers' });
    }
  })
  
  router.get('api/users-like-name/:id', async(req, res) => { //fetch the names of likers in post
    const postId = req.params.id;

    try {
        const likers = await db.query(`
            SELECT users.id, users.firstname, users.lastname FROM likes
            JOIN ON users ON likes ON likes.user_id = users.id WHERE likes.post_id = $1`, [postId]);
            res.status(200).json(likers.rows);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Error fetching followers' });
    }
  })

router.post(`api/users/:id/profile-picture`, upload.single('profilePicture'), async(req, res) => {
    const userId = req.params.id;

    if(!req.file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    const filePath = `public/uploads/${req.file.filename}`; //path directory of the upload profilepic

    try { //save the filepath into the users table db
        await db.query(`
            UPDATE users SET profile_pictures = $1 WHERE id = $2`,
        [filePath, userId]);

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: filePath
        });
        
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture' });
    }
})
  
export default router;

