import crypto from 'crypto';
import { sendVerification } from '../src/utils/sendVerification.js'
import db from '../db/connection.js';

export const googleAuth = async (accessToken, refreshToken, profile, cb) => {
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
}

