import db from '../db/connection.js';
import router from '../routes/authRoutes.js';

//create a new post 

export const createPost = async (req, res) => {
    // console.log(req.file);
    const {content, title, category} = req.body;
    const userId = req.user ? req.user.id : null;
    const imagePath = req.file ? `/uploads/newsfeed/${req.file.filename}` : null;
    // console.log(req.body);

    try {
        //insert new post into database
        const result = await db.query('INSERT INTO posts (user_id, content, title, image, category) VALUES($1, $2, $3, $4, $5) RETURNING *', [userId, content, title, imagePath, category]);
        res.redirect('/homepage');
        return;

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating post" });
    }
}

export const deletePost = async(req, res) => {
    //delete post 
    const postId = req.params.id;
    try {
        const result = await db.query("DELETE FROM posts WHERE id = $1 RETURNING *", [postId]);
        if(result.rows.length > 0) {
            res.redirect('/myProfile')
        }
        return res.status(404).json({ message: 'Post not found' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting post' });
    }
}

export const updatePost = async(req, res) => {
    //update post
    const postId = req.params.id;
    const {title, content} = req.body;
    try {
        const result = await db.query("UPDATE posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3", 
            [title, content, postId]
        )
        res.redirect('/myProfile');
    } catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
}