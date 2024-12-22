import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator"; // For validation
import exp from "constants";
import fs from "fs";
import { ifError } from "assert";
import { error } from "console";

const app = express();
const port = 3000;

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.urlencoded({extended: true}));

const secret_key = '2sd5s8d00s522f22sd0';
let users = [];



app.get('/landingpage', (req, res) => {
    res.render('landingpage');
})
app.get('/about', (req, res) => {
    res.render('about');
})
app.get('/login', (req, res) => {
    res.render('login');
})


//creating a users account using signup post method
app.post('/signup', async (req, res) => {
    
    const {email, password} = req.body; //get the users input of email and password

    //hash the users password
    const hashedPassword = await bcrypt.hash(password, 5);
    console.log(hashedPassword);
    
    const newUser = {email, password: hashedPassword};

    
    users.push(newUser);
    const newEmail = (users[0].email);
    console.log(newEmail);
    // users.push(newUser);


    // let existingUsers = [];
    // fs.readFile('users.json', 'utf8', (err, data) => {
    //     existingUsers.push(data);
    // })

    fs.readFile('users.json', 'utf8', (err, data) => {
        if(err) throw err;
        let existingUsers = [];
        existingUsers = JSON.parse(data);
        users.push(existingUsers);
        console.log(existingUsers);
        
        //check if user email already exist
        existingUsers.forEach(existingemail => {
            const userExist = existingemail === email;
            if(userExist) {
                return res.status(400).json({ message: "User already exists" });
            } 
        });
        
        const jsonData = JSON.stringify(users, null, 2);
        fs.writeFile('users.json', jsonData, (err) => {
            if(err) {
                console.log(err);
            } else {
                console.log('saved');
            }
        });
        
        return res.status(201).json({ message: "User created successfully" });
    });
        
})

    



app.listen(port, () => {
    console.log(`server running on port ${port}`);
})