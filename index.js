import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import pg from "pg";
import session from 'express-session';
import passport from "passport";
import {Strategy} from 'passport-local';



const app = express();
const port = 3000;

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.urlencoded({extended: true}));
app.set('views', 'views');

app.use(session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60 * 10}
}));

app.use(passport.initialize());
app.use(passport.session());

const secret_key = '2sd5s8d00s522f22sd0';
const usersFilePath = 'users.json';

const db = new pg.Client({
    user: 'postgres',
    database:'iskrib',
    host: 'localhost',
    password: 'magnificent2',
    port: 5432
})
db.connect();

const readUserData = () => {
    if(!fs.existsSync(usersFilePath)) { //it check's the json file if it exist else it will return [];
        return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8'); //read the userfilpath that contain users data
    return data ? JSON.parse(data) : [];  //if JSON data was parsed succesfully it will return it else
    // it will return a blank array []
}

//function to write users data
const writeUsersData = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2)); //JSON.stringify is to make 
    // javascript object into a json string
}

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
        res.render('login');
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
}))
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
    cb(null, user);
})
passport.deserializeUser((user, cb) => {
    cb(null, user);
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})