// routes/authRoutes.js
import express from 'express';
import { signup } from '../controllers/authcontroller.js';
import passport from "passport";
import db from "../db/connection.js";
import { checkProfileCompletion } from '../middleware/profilecompletion.js';
import { updateProfile } from '../controllers/authcontroller.js';
import { getProfile } from '../controllers/userController.js';


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
router.get('/homepage',checkProfileCompletion,(req, res) => {
    const user = req.user;
    if(!req.isAuthenticated()) {
        res.redirect('/login');  // Redirect if user is not logged in
    } else{
        res.render('homepage', {user: req.user})
    }
});

 router.get('/login', (req, res) => {
    if(req.isAuthenticated()) {
        const user = req.user;
        res.render('homepage', {user: user});
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

router.get('/', (req, res) => {
    if(req.isAuthenticated()) {
        return res.render('homepage', {user: req.user});
    } else {
        res.render('landingpage');
    }
})

router.get('/profile', checkProfileCompletion, (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage', {user: req.user});
    }
    res.redirect('/login')
});


// Route to handle profile form submission
router.post('/profile', updateProfile);

router.get('/about', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage', {user: req.user});
    } else {
        res.render('about');
    }
})

router.get('/landingpage', (req, res) => {
    if(req.isAuthenticated()) {
        return res.render('homepage', {user: req.user});
    } else {
        res.redirect('/');
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

router.post('/edit-profile',  updateProfile)


export default router;