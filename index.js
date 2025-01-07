import express from "express";
import path, { format } from "path";
import bcrypt from 'bcrypt';
import pg from "pg";
import session from 'express-session';
import passport from "passport";
import {Strategy} from 'passport-local';
import flash from 'connect-flash';
import env from "dotenv";
import GoogleStrategy from 'passport-google-oauth2';
import nodemailer from "nodemailer";
import crypto from "crypto";




const app = express();
const port = 3000;
env.config();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.urlencoded({extended: true}));
app.set('views', 'views');

app.use(session({
    secret: process.env.COOKIES_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60 * 10},
    secure: process.env.NODE_ENV === 'false', // Ensure secure cookies in production, false if not in production
    httpOnly: true // Protect cookie from being accessed via JavaScript
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const db = new pg.Client({
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    host: process.env.HOST,
    password: process.env.PG_PASSWORD,
    port: process.env.PORT
})
db.connect();

//create a function to send email verification
async function sendVerification(userEmail, verificationToken) {
   
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
}

app.get('/verify-email', async (req, res) => {
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
        res.send('Verification success! You can now log in using you gmail!');

    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during verification');
    }
})

app.get('/', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage');
    } else {
        res.render('landingpage');
    }
})
app.get('/landingpage', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage');
    } else {
        res.render('landingpage');
    }
})
app.get('/about', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage');
    } else {
        res.render('about');
    }
})
app.get('/login', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage');
    } else {
        res.render('login', {errorMessage: req.flash('error')});
    }
})
app.get('/homepage', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('homepage');
    } else {
        res.redirect('/login');
    }
})
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email']

}))


app.get('/auth/google/homepage', passport.authenticate('google', { ///Google OAuth Callback (passport.authenticate('google')): The flow is enhanced by ensuring that the user is logged in after the Google OAuth process is completed and the new user is created if they don’t exist.
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: true, // sets a error message to the login.ejs view and fetch the data to the locals.errorMessage
}));

//creating a users account using signup post method
//route to store users email and password
app.post('/signup', async (req, res) => {
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
})

app.post('/log', passport.authenticate('local', {
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: true, // sets a error message to the login.ejs view and fetch the data to the locals.errorMessage
}));

app.post('/logOut', (req, res) => {
    req.logout(err => {
        if(err) {
            console.error(err);
        }
        res.redirect('/login');
    })
})

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
            return cb(null, false);
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
        console.log(profile);
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

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})