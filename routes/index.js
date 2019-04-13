const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

// Requiring db models to execute quireying
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');


router.get('/', ensureAuthenticated, (req, res) => {

    // Finding the latest post from database and populating comments and user.
    Post.findOne()
        .sort({ "_id": -1 })
        .populate({
            path: '_user',
            select: 'firstname lastname'
        })
        .exec((err, post) => {
            if (err) {
                throw err;
                /*
                console.log(">>>ERROR!");
                req.flash('error_msg', 'An error accured when fetching');
                res.res.render('index', {
                    title: 'Dashboard | Info Point',
                    name: req.user.firstname,
                    lastLogged: lastOnline
                });
                */
            }

            let lastOnline = undefined;

            if (typeof req.user.lastLogged != 'undefined') {
                // Formatting the "Last online" date displayed on dashboard
                lastOnline = (req.user.lastLogged.getMonth() + 1) + '/' + req.user.lastLogged.getDate() + '/' +  req.user.lastLogged.getFullYear() + ' | ' 
                            + req.user.lastLogged.getHours()
                            + ':' + ((req.user.lastLogged.getMinutes() < 10) ? '0' + (req.user.lastLogged.getMinutes()) : req.user.lastLogged.getMinutes())
                            + ':' + ((req.user.lastLogged.getSeconds() < 10) ? '0' + (req.user.lastLogged.getSeconds()) : req.user.lastLogged.getSeconds());
            }
            
            // if a post is found, render dashboard with appropriate variables
            if (post) {

                // Setting name of the user that created the found post and creation date to dedicated variables
                const postedBy = post._user.firstname + ' ' + post._user.lastname;
                const postedDate = (post.date.getMonth() + 1) + '/' + post.date.getDate() + '/' +  post.date.getFullYear();
                const postedUserId = post._user._id;

                // Fetch comments that belong to the post. 
                Comment.find({ '_post': post._id })
                    .limit(20)
                    .populate({
                        path: '_user',
                        select: 'firstname lastname profilePic'
                    })
                    .exec((err, comments) => {                        
                        if (err) {
                            throw err;
                            /*
                            console.log(">>>ERROR!");
                            req.flash('error_msg', 'An error accured when fetching');
                            res.redirect('/');
                            */
                        } else {
                            res.render('index', {
                                title: 'Dashboard | Info Point',
                                name: req.user.firstname,
                                lastLogged: lastOnline,
                                post: post,
                                postedDate: postedDate,
                                postedBy: postedBy,
                                postedUserId: postedUserId,
                                comments: comments
                            });
                        }

                        
                });
            } else { // If no posts are found, render dashboard with flash message
                console.log(">>> No post found!");
                req.flash('error_msg', 'No posts in database!');
                res.render('index', {
                    title: 'Dashboard | Info Point',
                    name: req.user.firstname,
                    lastLogged: lastOnline
                });
            }
    });
});

module.exports = router;