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
        .populate('_user')
        .populate('comments')
        .exec((err, post) => {
            if (err) {
                console.log(">>>ERROR!");
                req.flash('error_msg', 'An error accured when fetching');
                res.redirect('/');
            }

            // Setting the populated user on post and comments
            // password to "undefined" so it is not accessable on client side
            post._user.password = undefined;

            post.comments.forEach((comment) => {
                comment._user.password = undefined;
            });

            const postedBy = post._user.firstname + ' ' + post._user.lastname;
            const postedDate = (post.date.getMonth() + 1) + '/' + post.date.getDate() + '/' +  post.date.getFullYear();

            if (post) {
                Comment.find({ '_post': post._id })
                    .limit(20)
                    .populate('_user')
                    .exec((err, comments) => {
                        
                        // Populating the user of each comment to get the users name to display above the comment
                        comments.forEach((comment) => {
                            comment._user.password = undefined;
                        });

                        res.render('index', {
                            title: 'Dashboard | Info Point',
                            name: req.user.firstname,
                            post: post,
                            postedDate: postedDate,
                            postedBy: postedBy,
                            comments: comments
                        });
                });
            } else {
                console.log(">>>No post found!");
                req.flash('error_msg', 'No posts in database!');
                res.redirect('/');
            }
    });
});

module.exports = router;