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
const usersFilePath = 'users.json';

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
//route to store users email and password
app.post('/signup', async (req, res) => {
    
    const {email, password} = req.body; //get the users input of email and password
    const hashedPassword = await bcrypt.hash(password, 5);
    let users = readUserData();
    // console.log(users);

    //check if the email is already used
    if(users.find((user) => user.email === email)) {
        return res.status(400).send('email is already registered');
    }
    users.push({email, password: hashedPassword});

    writeUsersData(users);
    res.status(201).send('user registered succesfully');      
})

    



app.listen(port, () => {
    console.log(`server running on port ${port}`);
})