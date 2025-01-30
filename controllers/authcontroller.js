import bcrypt from 'bcrypt';
import { sendVerification } from '../src/utils/sendVerification.js'
import db from "../db/connection.js";
import crypto from "crypto";
import { resetPasswordVerification } from '../src/utils/resetPasswordVerification.js'
import { Result } from 'express-validator';




//signup controller

export const signup = async (req, res) => {
    const {email, password, firstname, lastname, gender} = req.body
        try {
            const verificationToken = crypto.randomBytes(20).toString('hex');
            const checkEmail = await db.query('SELECT * FROM users WHERE email = $1', [email]); 
            //check if email is already exist
            if(checkEmail.rows.length > 0) {
                return res.render('index', {errorMessage: '*Email is already used, please try again!'})
            } else {
                const hashedpassword = await bcrypt.hash(password, 5);
            const data = await db.query("INSERT INTO users (email, password, firstname, lastname, gender, verification_token, token_expiry) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 HOUR' ) RETURNING *",
                        [email, hashedpassword, firstname, lastname, gender, verificationToken])
                    const newUser = data.rows[0];
            // const data = await db.query( //use the returning fucntion to return all the data that sent to the backend
            //     'INSERT INTO users (email, password, firstname, lastname, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *', 
            //     [email, hashedpassword, firstname, lastname, gender]);
            sendVerification(email, verificationToken);
            res.render('landingpage', {errorMessage: 'Please check your email to verify your account'});
            }
        
        } catch (error) {
            res.redirect('/landingpage');
        }
}


//forgotpassword controller 

export const forgotPassword = async (req, res) => {
    const email = req.body.username;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if(result.rows.length > 0) {
            const user = result.rows[0];
            const resetToken = crypto.randomBytes(20).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); //token expires in 1 hour

            //save token into database
            await db.query("UPDATE users SET verification_token = $1, token_expiry = $2 WHERE id = $3", [resetToken, resetTokenExpiry, user.id]);


            //send a verification link to route the user on reset page
            await resetPasswordVerification(email, resetToken);
            res.render('forgetpassword', {errorMessage: 'A password reset link has been sent to your email.'});
        } else {
            return res.render('forgetpassword', {errorMessage:'email not exist'});
        }
    } catch (error) {
        console.error(error.message);
    }
}

export const resetPasswordPage = async (req, res) => {
    const { token } =  req.params;
     // Validate if token exists in the database
    const result = await db.query("SELECT * FROM users WHERE verification_token = $1", [token]);

    if (result.rows.length > 0) {
        const user = result.rows[0];

        // Token is valid, render the reset password page with token
        if(new Date() > new Date(user.token_expiry)) {
            return res.render('resetpassword', { errorMessage: 'Reset token has expired.' });
        }
        res.render('resetpassword', { token });
    } else {
        // Token is invalid or expired
        res.render('resetpassword', { errorMessage: 'Invalid or expired token.' });
    }
};


export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const newPassword = req.body.password;

    try {
         // Query the database to find the user by verification token
        const user = await db.query("SELECT * FROM users WHERE verification_token = $1", [token]);
        if(user.rows.length > 0) {
            // Check if the token has expired
            if(new Date() > new Date(user.token_expiry)) {
                return res.render('forgetpassword', {errorMessage: 'Reset token has expired'});  
            }
            const hashedpassword = await bcrypt.hash(newPassword, 10);
            
            await db.query("UPDATE users SET password = $1 WHERE verification_token = $2", [hashedpassword, token]);
            await db.query("UPDATE users SET verification_token = NULL, token_expiry = NULL WHERE verification_token = $1", [token]);
            return res.render('login', { errorMessage: 'Password has been reset successfully. You can now login with your new password.' });
        }
    } catch (error) {
        console.error(error);
        res.render('resetPassword', { errorMessage: 'An error occurred while resetting your password.' });
    }
}

import fs from 'fs';
import path from 'path';

// handle profile form submission (update the user's profile in the database)
export const updateProfile = async (req, res) => {
    const { firstname, lastname, bio, gender } = req.body;
    // console.log(req.file);
          
    let filePath = null;

    try {
        // check if the user has a current profile picture
        const user = await db.query('SELECT profile_pictures FROM users WHERE id = $1', [req.user.id]);
        const oldFilePath = user.rows[0].profile_pictures;

        // ff there is a new file uploaded, handle the file update
        if (req.file) {
            filePath = `/uploads/${req.file.filename}`;  // path of the new profile picture
            
            // delete the old file if it exists
            if (oldFilePath) {
                const oldFile = path.join(process.cwd(), 'public', oldFilePath); // get the absolute path to the old file
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile); // delete the old file
                }
            }
        }

        // update user's profile details in the database
        await db.query(
            'UPDATE users SET firstname = $1, lastname = $2, gender = $3, bio = $4, profile_pictures = $5 WHERE id = $6',
            [firstname, lastname, gender, bio, filePath, req.user.id]
        );
        
        res.redirect('/myProfile');  // redirect to the profile page after successful update
    } catch (error) {
        console.error(error);
        if (error instanceof multer.MulterError) {
            res.status(400).send({ error: error.message });
        } else {
            res.status(400).send({ error: error.message });
        }
    }
}
