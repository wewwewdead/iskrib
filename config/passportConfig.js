import passport from 'passport';
import {Strategy} from 'passport-local';
import GoogleStrategy from 'passport-google-oauth2';
import bcrypt from 'bcrypt';
import db from '../db/connection.js';  // Import the DB connection
import crypto from "crypto";
import { sendVerification } from '../src/utils/sendVerification.js';

passport.use('local', new Strategy(async function verify(username, password, cb) {

    ///Once the user has verified their email, you can allow them to log in as normal. 
    // If they haven’t verified their email, you can block them from logging in 
    // or redirect them to a page indicating that their email is not verified.
    // You can handle this in your login logic, after checking the user's credentials:

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);

        if(result.rows.length > 0 ) {
            const user = result.rows[0];
            const storedPassword = user.password;
            const isMatch = await bcrypt.compare(password, storedPassword);
            if(isMatch) {
                if(user.verified) {
                    return cb(null, user);
                } else {
                    return cb(null, false, {message: 'Please verify your email'})
                }
            } else {
                return cb(null, false, {message: 'invalid password or email'})
            }
        } else {
            return cb(null, false, {message: 'email or password not exist, please SIGN UP!'});
        }
    } catch (error) {
        console.log('error')
        return cb(error, null)
    }
}));

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/homepage',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    async (accessToken, refreshToken, profile, cb) => {
        try {
            const verificationToken = crypto.randomBytes(20).toString('hex');  // generate a random token
            const result = await db.query('SELECT * FROM users where email = $1', [
                profile.email
            ])

            if(result.rows.length === 0) {
                const data = await db.query("INSERT INTO users (email, password, firstname, lastname, gender, verification_token, token_expiry) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 HOUR' ) RETURNING *",
                    [profile.email, 'google', profile.given_name, profile.family_name, '', verificationToken])
                const newUser = data.rows[0];

                sendVerification(profile.email, verificationToken);

                return cb(null, false, {message: 'Please check your email to verify your account'});
            } else {
                const verificationToken = crypto.randomBytes(20).toString('hex');
                const user = result.rows[0];
                if(!user.verified) { //email not verified send a verification email
                    sendVerification(user.email, verificationToken);
                    return cb(null, false, {message: 'Please check your email to verify your account'});
                } else {
                    return cb(null, result.rows[0]) // if email is verified then let user pass the auth wall.   
                }
            }

        } catch (error) {
            console.error('Google OAuth error:', error)
            return cb(error, null);
        }
        // User.findOrCreate({ googleId: profile.id }, function (err, user) {
        //     return cb(err, user);
        //   });
    }))

    passport.serializeUser((user, cb) => {
        cb(null, user.id);
    })
    passport.deserializeUser( async(id, cb) => {
        try {
            const response = await db.query('SELECT * FROM users WHERE id = $1', [id]);
            if(response.rows.length > 0) {
                return cb(null, response.rows[0]); //refetch the user data from database
            } else {
                return cb(new Error('User not found'), null);
            }
        } catch (error) {
            console.error(error.message);
            return cb(error, null); //return a error message without users data because it's null in a callback parameter
        }
    })