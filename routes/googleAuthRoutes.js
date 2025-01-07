// routes/googleAuthRoutes.js
import express from 'express';
import passport from 'passport';
import { googleAuth } from '../controllers/googleAuthController.js';

const router = express.Router();

router.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

router.get('/auth/google/homepage', passport.authenticate('google', {
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: true,
}));
router.get('/reset-password/auth/google', passport.authenticate('google', {
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: true,
}));

export default router;