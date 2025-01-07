import db from '../db/connection.js';

//create a new post 

export const createPost = async (req, res) => {
    const {content} = req.body;
    const userId = user.id;

    try {
        //insert new post into database
        const result = await db.query('INSERT INTO posts (user_id, content) VALUES($1, $2) RETURNING *', [userId, content]);
        res.redirect('/homepage');
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating post" });
    }
}