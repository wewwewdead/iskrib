import express from 'express';
import { forgotPassword, resetPassword, resetPasswordPage } from '../controllers/authcontroller.js';

const router = express.Router();

router.post('/forgotPassword', forgotPassword);

// Route to show the reset password form with the token (GET method)
router.get('/reset-password/:token', resetPasswordPage);

router.post('/reset-password/:token', resetPassword);  

export default router;