import express from "express";
import path from "path";

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/landingpage', (req, res) => {
    res.render('landingpage');
})
app.get('/about', (req, res) => {
    res.render('about');
})
app.get('/login', (req, res) => {
    res.render('login');
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})