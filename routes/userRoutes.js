// routes/userRoutes.js
import express from 'express';
import { checkProfileCompletion } from '../middleware/profilecompletion.js';
import { updateProfile } from '../controllers/userController.js';


const router = express.Router();

// Route for setting up the profile (first-time users or incomplete profiles)
// router.get('/profile', checkProfileCompletion, (req, res) => {
//     res.render('profile', { user: req.user }); // Render the profile setup form
// });

// Route for the newsfeed page (for users with completed profiles)
router.get('/homepage', checkProfileCompletion, (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage', { user: req.user });  // Pass user to the view
    } else {
        res.redirect('/login');  // Redirect if user is not logged in
    }
});



export default router;