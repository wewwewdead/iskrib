import path from "path";
import db from "../db/connection.js";
import multer from "multer";

const storagePictures = multer.diskStorage({
    destination: function(req, file, cb) {
        const absolutePath = path.join(process.cwd(), 'public/uploads')
        cb(null, absolutePath) //directory to save profile pictures
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E5); //generate a random suffix for making the file unique
        cb(null, file.fieldname + '-' + uniqueName + path.extname(file.originalname));
    }
})

const storagePicturesNewsfeed = multer.diskStorage({
    destination: function(req, file, cb) {
        const absolutePath = path.join(process.cwd(), 'public/uploads/newsfeed')
        cb(null, absolutePath) //directory to save profile pictures
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E5); //generate a random suffix for making the file unique
        cb(null, file.fieldname + '-' + uniqueName + path.extname(file.originalname));
    }
})

//file upload filter
const filter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        req.fileValidationError = 'Unsupported file type! Only jpeg, png and jpg are allowed.';  // set the error on the request
        cb(null, false);  // reject the file
    }
};

export const upload = multer({
    storage: storagePictures, 
    fileFilter: filter, 
    limits: { fileSize: 5 * 1024 * 1024 }});

export const uploadPicture = multer({
    storage: storagePicturesNewsfeed, 
    fileFilter: filter,
    limits: {fileSize: 5 * 1024 * 1024}})


