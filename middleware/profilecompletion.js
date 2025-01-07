import db from '../db/connection.js';

export const checkProfileCompletion = async (req, res, next) => {
    const userId = req.user ? req.user.id : null;

    try {
        if(!userId) {
            return res.redirect('/login');
        }
        // Fetch user profile from the database
        const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
        if(user.rows.length > 0) {
            const currentUser = user.rows[0];
            // Check if essential fields are missing
            if(!currentUser.firstname || !currentUser.lastname || !currentUser.gender || !currentUser.bio) {
                return res.render('profile', {user: user.rows[0]});
            } else {
                return next();
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
     
}