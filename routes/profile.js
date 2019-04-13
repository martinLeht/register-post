const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const moment = require('moment');
const { ensureAuthenticated } = require('../config/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const path = require('path');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override'); 

const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models//comment');


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


// @route GET /profile/:id
// @desc Route to get users profile by Id
router.get('/:id', ensureAuthenticated, (req, res) => {

    const userId = req.params.id;

    // Fetch user by provided id
    Post.find({ '_user': userId }, (err, posts) => {

        if (err) throw err;

        let errors = [];
        let hasNoPosts = false; 

        // If no posts found, mark that user has no posts as true
        if (posts.length == 0) {
            hasNoPosts = true;
        }

        // Put date days ago to dedicated list
        var postDaysAgo = [];

        // Incremet through posts and map their posted days ago in "postDaysAgo" by post id
        posts.forEach(post => {

            // Calculate days ago
            var mom = moment(post.date),
                now = moment(),
                diffInDays = mom.from(now);

            postDaysAgo[post._id] = diffInDays;
        });


        let lastOnline = undefined;

        if (typeof req.user.lastLogged != 'undefined') {
            // Formatting the "Last online" date displayed on dashboard
            lastOnline = (req.user.lastLogged.getMonth() + 1) + '/' + req.user.lastLogged.getDate() + '/' +  req.user.lastLogged.getFullYear() + ' | ' 
                        + req.user.lastLogged.getHours()
                        + ':' + ((req.user.lastLogged.getMinutes() < 10) ? '0' + (req.user.lastLogged.getMinutes()) : req.user.lastLogged.getMinutes())
                        + ':' + ((req.user.lastLogged.getSeconds() < 10) ? '0' + (req.user.lastLogged.getSeconds()) : req.user.lastLogged.getSeconds());
        }
        
        res.render('profile', {
            title: "Profile | Info Point",
            posts: posts,
            daysAgo: postDaysAgo,
            errors: errors,
            hasNoPosts: hasNoPosts,
            lastOnline: lastOnline
        });
    });

});

// @route POST /profile/update/:id
// @desc Route to update user by id
router.post('/update/:id', ensureAuthenticated, (req, res) => {

    // Get id from parameter
    const userId = req.params.id;

    // Check that currently logged users id matches with the params id
    if (userid == req.user._id) {

        // Gett data from submitted form and trim trailing and leading whitespace
        let firstname = req.body.firstname.trim();
        let lastname = req.body.lastname.trim();
        let email = req.body.email.trim();
        let street = req.body.street.trim();
        let city = req.body.city.trim();
        let postalCode = req.body.postalCode.trim();

        // Cheking if required fields are empty, if so redirect to profile with error
        if (!firstname || !lastname || !email) {
            req.flash('error_msg', 'Fill all the required fields!');
            res.redirect('/profile/' + userId);
        } else {

            // Else get passwords from submitted form
            let password = req.body.pass;
            let confirmPass = req.body.confirmPass;

            // Compare passwords in body and if they match, start fetching user from db
            if (password == confirmPass) {

                User.findById(userId, (err, user) => {
                    if (err) throw err;

                    // If no user found, redirect to profile with error
                    if (!user) {
                        console.log("No user found");
                        req.flash('error_msg', 'No user found!');
                        res.redirect('/profile/' + req.user._id);
                    } else {

                        // Compare password from body to the found user password
                        console.log("User found");
                        bcrypt.compare(password, user.password, (err, isMatch) => {
                            if (err) throw err;
                            
                            // If passwords match, change the information and save the object
                            if(isMatch) {

                                // Chenge data
                                user.firstname = firstname;
                                user.lastname = lastname;
                                user.email = email;
                                user.street = street;
                                user.city = city;
                                user.postalCode = postalCode;

                                // Save object, redirect to profile with success message
                                user.save()
                                    .then(user => {
                                        req.flash("success_msg", "Successfully updated profile!");
                                        res.redirect('/profile/' + userId);
                                    })
                                    .catch(err => console.log(err));
                            }
                        });
                    }
                });
            } else {
                // Redirect to profile with error
                req.flash('error_msg', 'Passwords did not match!');
                res.redirect('/profile/' + userId);
            }       
        }
    } else {
        req.flash("error_msg", "You dont have the permissions to edit this account");
        res.redirect('/profile/' + req.user._id);
    }
});


// @route POST /profile/changePassword/:id
// @desc Route for changing/updating users password
router.post('/changePassword/:id', ensureAuthenticated, (req, res) =>  {

    const userId = req.params.id;

    // Check that currently logged users id matches with the params id
    if (userid == req.user._id) {
        // Find user by id
        User.findById(userId, (err, user) => {
            if (err) throw err;

            // If no user found, redirect to profile
            if (!user) {
                console.log("No user found");
                req.flash("error_msg" ,"User not found");
                res.redirect('/profile/' + req.user._id);
            } else {

                // getting data from submitted form
                let password = req.body.newPass;
                const confirmPass = req.body.confirmPass;

                // If passwords match when confirming new password
                if (password == confirmPass) {
                    const oldPass = req.body.oldPass;

                    // Compare old password with user password
                    bcrypt.compare(oldPass, user.password, (err, isMatch) => {
                        if (err) throw err;

                        // If password matches with found users, change password
                        if (isMatch) {
                            bcrypt.genSalt(10, (err, salt) => {
                                if (err) throw err;
                                bcrypt.hash(password, salt, (err, hash) => {
                                    console.log(user);
                                    user.password = hash;
                                    user.lastLogged = Date.now();
                                    console.log(user);
                                    user.save()
                                        .then(user => {
                                            req.logOut();
                                            req.flash("success_msg", "Password changed successfully. Try to login now!");
                                            res.redirect('/login');
                                        });
                                });
                            });
                        } else {
                            
                            // If old password in submitted form does not match with users pass in db, redirect with erropr
                            req.flash("error_msg", "Registered users password did not match with old password");
                            res.redirect('/profile/' + req.user._id);
                        }
                    });
                } else {
                    req.flash("error_msg", "Passwords did not match");
                    res.redirect('/profile/' + req.user._id);
                }
            }
        });
    } else {
        req.flash("error_msg", "You dont have the permissions to edit this account");
        res.redirect('/profile/' + req.user._id);
    }

});


// @route POST /profile/delete/:id
// @desc Route for deleting user by id
router.post('/delete/:id', ensureAuthenticated, (req, res) => {
    
    const userId = req.params.id;

    if (userId == req.user._id) {

        // Delete all comments with the user id
        Comment.deleteMany({ '_user': userId }, (err, result) => {
            if (err) throw err;
            console.log(result);

            // Delete all posts with the user id
            Post.deleteMany({ '_user': userId }, (err, result) => {
                if (err) throw err;
                console.log(result);

                // Lastly delete the user account with the user id and redirect to login
                User.findByIdAndRemove( userId, (err, result) => {
                    if (err) throw err;
                    console.log(result);

                    req.logOut();
                    req.flash("success_msg", "Successfully deleted account");
                    res.redirect('/login');
                });
            });
        });
    } else {
        req.flash("error_msg", "You dont have the permissions to delete this account");
        res.redirect('/profile/' + req.user._id);
    }
});


// @route POST /profile/upload
// @desc Route for uploading a profile picture


module.exports = router;