import db from "../db/connection.js";
import { resetPassword } from "./authcontroller.js";


export const getProfile = async (req, res) => {
    try {
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
        const page = parseInt(req.query.page) || 1;  // Get the page number from the query string (default to 1 if not provided)
        const limit = 5;
        const offset = (page - 1) * limit;

        //fetch users porst into profilepage 
        const getPost = await db.query("SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", [req.user.id, limit, offset]);

        const totalPostsResult = await db.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [req.user.id]);
        const totalPosts = parseInt(totalPostsResult.rows[0].count);
        const totalPages = Math.ceil(totalPosts / limit); //math.ceil going to round a number upward to its nearest integer


        res.render('myProfile', { user: user.rows[0], posts:  getPost.rows, currentPage: page, totalPages:totalPages});

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


// Handle profile form submission (update the user's profile in the database)
export const updateProfile = async (req, res) => {
    const { firstname, lastname, gender, bio } = req.body;
    try {
        // Update user's profile details in the database
        await db.query(
            'UPDATE users SET firstname = $1, lastname = $2, gender = $3, bio = $4 WHERE id = $5',
            [firstname, lastname, gender, bio, req.user.id]
        );
        res.redirect('/myProfile'); // Redirect to the profile page after successful update
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

//get all post for newsfeed
export const getNewsfeed = async (req, res) => {
    try {
        //pagination of post into the newsfeed
        const page = req.query.page || 1;
        const limit = 5;
        const offset = (page - 1) * limit;
        const result = await db.query('SELECT p.id, p.user_id, p.content, p.created_at, u.firstname, u.lastname FROM posts JOIN users u ON p.user_id = u.id ORDER BT p.created_at DESC LIMIT $1, OFFSET $2', 
            [limit, offset]);

        const allPosts = result.rows;
        res.render('homepage', {posts: allPosts});

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching newsfeed" });
    }
}