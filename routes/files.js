const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const path = require('path');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../config/auth');

const User = require('../models/user');

const conn = mongoose.connection;

// Init gfs
let gfs;

conn.once('open', () => {
    // Initialize stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine for uploading picture
const storage = new GridFsStorage({
    url: process.env.MONGOLAB_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
  });
const upload = multer({ storage });


// @route POST /profile/upload/:id
// @desc Upload a profile picture
router.post('/upload/:id', ensureAuthenticated, upload.single('file'), (req, res) => {

    const userId = req.params.id;

    if (userId == req.user._id) {

        // Find user by if and set the newly uploaded files unique filename as users "profilePic" field
        User.findById(userId, (err, user) => {
            if (err) throw err;

            
            if (req.file) {
                console.log(req.file);
                const filename = req.file.filename;
                console.log(filename);
                user.profilePic = filename;

                user.save()
                    .then(user => {
                        console.log(user);
                        req.flash('success_msg', 'Profile picture successfully updated');
                        res.redirect('/profile/' + req.user._id);
                    })
                    .catch(err => console.log(err));
            }
        });

    } else {
        req.flash('error_msg', 'You dont have the persmission to upload pictures to this profile');
        res.redirect('/profile/' + req.user._id);
    }
});


// @route DELETE /files/:filename
// @desc Delete a file by filename
router.delete('/delete/:filename', ensureAuthenticated, (req, res) => {

    gfs.remove({ filename: req.params.filename, root: 'uploads'}, (err, gridStore) => {
        if (err) {
            return res.status(404).json({err: err});
        }

        User.findById(req.user._id, (err, user) => {
            if (err) throw err;

            user.profilePic = undefined;

            user.save()
                .then(user => {
                    console.log(user);
                    req.flash('success_msg', 'Profile picture deleted successfully');
                    res.redirect('/profile/' + req.user._id);
                })
                .catch(err => console.log(err));

        });

    });
});


// @route GET /files
// @desc Lists all uploaded files in mongo db as JSON
router.get('/', ensureAuthenticated, (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
            return res.status(404).json( {
                err: 'No files exist'
            });
        }

        // Files exist
        return res.json(files);
    });
});

// @route GET /files/:filename
// @desc display single file from mongo db as JSON
router.get('/:filename', ensureAuthenticated, (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if files
        if (!file || file.length === 0) {
            return res.status(404).json( {
                err: 'No file found'
            });
        }

        // Files exist
        return res.json(file);
    });
});


// @route GET /files/image/:filename
// @desc Display image
router.get('/image/:filename', ensureAuthenticated, (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if files
        if (!file || file.length === 0) {
            return res.status(404).json( {
                err: 'No file found'
            });
        }

        // Check if image
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            // Read output to browser

            const readstream = gfs.createReadStream(file.filename);
            res.set('Content-Type', file.contentType);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

module.exports = router;