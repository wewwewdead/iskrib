import express from 'express';
import passport from 'passport';
import session from 'express-session';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import './config/passportConfig.js'
import path from "path";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";

dotenv.config();
const app = express();
const port = 3000;

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

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('homepage');  // If the user is authenticated, show homepage
    } else {
        res.render('landingpage');  // If the user is not authenticated, show landing page
    }
});

//routes 
app.use(authRoutes);
app.use(googleAuthRoutes);
app.use(userRoutes);
app.use(forgotPasswordRoutes);

app.listen(port, (req, res) => {
    console.log(`server running on port ${port}`);
})