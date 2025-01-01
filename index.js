import express from "express";
import path from "path";
import bcrypt from 'bcrypt';
import pg from "pg";
import session from 'express-session';
import passport from "passport";
import {Strategy} from 'passport-local';
import flash from 'connect-flash';
import env from "dotenv";



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
    secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
    httpOnly: true // Protect cookie from being accessed via JavaScript
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const db = new pg.Client({
    user: 'postgres',
    database:'iskrib',
    host: 'localhost',
    password: process.env.DB_PASSWORD,
    port: 5432
})
db.connect();

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

//creating a users account using signup post method
//route to store users email and password
app.post('/signup', async (req, res) => {
    const {email, password, firstname, lastname, gender} = req.body
    try {
        const checkEmail = await db.query('SELECT * FROM users WHERE email = $1', [email]); 
        //check if email is already exist
        if(checkEmail.rows.length > 0) {
            res.render('index', {errorMessage: '*Email is already used, please try again!'})
        }
        const hashedpassword = await bcrypt.hash(password, 5);
        const data = await db.query( //use the returning fucntion to return all the data that sent to the backend
            'INSERT INTO users (email, password, firstname, lastname, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *', 
            [email, hashedpassword, firstname, lastname, gender]);

        const user = data.rows[0];
        req.login(user, (err) => {
            console.error(err);
            res.redirect('/landingpage');
        });

    } catch (error) {
        console.error(error.message);
    }
})

app.post('/log', passport.authenticate('local', {
    successRedirect: '/homepage',
    failureRedirect: '/login',
    failureFlash: 'Invalid email or password', // sets a error message to the login.ejs view and fetch the data to the locals.errorMessage
}));

app.post('/logOut', (req, res) => {
    req.logout(err => {
        if(err) {
            console.error(err);
        }
        res.redirect('/login');
    })
})

passport.use(new Strategy(async function verify(username, password, cb) {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);

        if(result.rows.length > 0 ) {
            const user = result.rows[0];
            const storedPassword = user.password;
            const isMatch = await bcrypt.compare(password, storedPassword);
            if(isMatch) {
                return cb(null, user);
            } else {
                return cb(null, false)
            }
        } else {
            return cb(null, false);
        }
    } catch (error) {
        console.log('error')
        console.error(error.message);
    }
}));

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