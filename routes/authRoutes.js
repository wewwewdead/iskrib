// routes/authRoutes.js
import express from 'express';
import { signup } from '../controllers/authcontroller.js';
import passport from "passport";
import db from "../db/connection.js";
import { checkProfileCompletion } from '../middleware/profilecompletion.js';
import { updateProfile } from '../controllers/authcontroller.js';
import { getNewsfeed, getProfile, getUserProfile, getUserPost } from '../controllers/userController.js';
import { createPost } from '../controllers/createPost.js';


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
        res.send(`Verification success! You can now log in using you gmail!`);

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during verification');
    }
})

// Route for the newsfeed page (for users with completed profiles)
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

router.get('/profile', checkProfileCompletion, getProfile, (req, res) => {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
    }
    
});


// Route to handle profile form submission
router.post('/profile', updateProfile);

router.get('/about', (req, res) => {
    if(!req.isAuthenticated()) {
        res.redirect('login')
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
        const user = req.user;
        res.render('bio', {user});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
})


router.get('/edit-profile', async(req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect('/login');  
    }
    res.render('edit-profile', { user: req.user });  // Render the edit profile form
})

//get post if user clicks the title of the post in newsfeed
router.get('/post/:id', getUserPost);

// router.get('/post/:id', async(req, res) => {
//     try {
//         const userId = req.params.id;
//         const postResult = await db.query("SELECT posts.id, posts.user_id, posts.content, posts.created_at, posts.title, users.firstname, users.lastname  FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = $1", [userId]);
//         const post = postResult.rows[0];

//         if(postResult.rows.length > 0) {
//             res.render('post', {post: post,
//                 user: req.user}
//             );
//         } else {
//             return res.status(404).render('404', { message: 'Post not found' });
//         }
  
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error loading post');
//     }
// })

router.get('/user/:id', getUserProfile);
//get the user profile page when clicked the username in newsfeed 
// router.get('/user/:id', async(req, res) => {
//     try {
//         const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

//         const userId = req.params.id;
//         const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

//         if(userResult.rows.length > 0) {
//              const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
//              const limit = parseInt(req.query.limit) || 5;
//              const offset = (page - 1) * limit;

//         //fetch users porst into profilepage 
//             const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset]);

//             const totalPostsResult = await db.query('SELECT COUNT(*) AS total FROM posts WHERE user_id = $1', [userId]);
//             const totalPosts = parseInt(totalPostsResult.rows[0].total);
//             const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer
        
//             if(totalPostsResult.rows.length > 0) {
                
//                 res.render('userProfile', {
//                     userClicked: userResult.rows[0],
//                     posts: getPost.rows,
//                     currentPage: page, 
//                     totalPages:totalPages,
//                     user: req.user
//                 });
//             } else {
//                 return res.status(404).render('404', { message: 'Profile not found' });
//             }
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error loading post');
//     }
// })


router.get('/userBio/:id', async(req, res) => {
    try {
        const userId = req.params.id;
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if(userResult.rows.length > 0) {
             const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
             const limit = parseInt(req.query.limit) || 5;
             const offset = (page - 1) * limit;

        //fetch users porst into profilepage 
            const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [userId, limit, offset]);

            const totalPostsResult = await db.query('SELECT COUNT(*) AS total FROM posts WHERE user_id = $1', [userId]);
            const totalPosts = parseInt(totalPostsResult.rows[0].total);
            const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer
        
            if(totalPostsResult.rows.length > 0) {
                
                res.render('userBio', {
                    userClicked: userResult.rows[0],
                    user: req.user
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

router.post('/edit-profile',  updateProfile)
router.post('/publish', createPost)

router.get('/api/posts/:id', async(req, res) => {
    try {
        const postId = req.params.id;
        const postResult = await db.query("SELECT * FROM posts WHERE id = $1", [postId]);

        if(postResult.rows.length > 0) {
            res.json(postResult.rows[0]);
        }
    } catch (error) {
        
    }
})



router.post('/posts/:id', async (req, res) => {
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
        console.log(result.rows.length);
    
        if (result.rows.length === 0) {
          return res.status(404).send({ message: 'Post not found' });
        }
        res.send({ message: 'Post deleted' }); // Return a success message
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while deleting the post' });
      }
});

export default router;

