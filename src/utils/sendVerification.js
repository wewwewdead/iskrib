import nodemailer from 'nodemailer';
import db from '../../db/connection.js';  // Import your database connection

export async function sendVerification(userEmail, verificationToken,) {
    try {
         //store the token in your database(with user and with expiration time)
            await db.query("UPDATE users SET verification_token = $1, token_expiry = NOW() + INTERVAL '1 HOUR' WHERE email = $2", [verificationToken, userEmail]);
        
            //set up email transport 
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL,
                    pass: process.env.GMAIL_PASSWORD,
                },
            })
        
            const mailOptions = {
                from: process.env.GMAIL,
                to: userEmail,
                subject: 'Email verification -ISKRIB',
                text: `Click the following link to verify your email: http://localhost:3000/verify-email?token=${verificationToken}`
            }//send the url to users and set up a route that will get the query which is the verificationToken and confirm it if it existed in the database 
            //using the app.get('/verify-email) and const {token} = req.query; 
        
            transporter.sendMail(mailOptions, (error, info) => {
                if(error) {
                    console.log('error sending email:', error);
                }
            })
        
    } catch (error) {
        console.error('Error in sendVerification function:', error);
    }  
}