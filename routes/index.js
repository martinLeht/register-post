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
                req.flash('error_msg', 'ERROR!');
                res.redirect('/');
            }

            const postedBy = post._user.firstname + ' ' + post._user.lastname;
            const postedDate = (post.date.getMonth() + 1) + '/' + post.date.getDate() + '/' +  post.date.getFullYear();

            if (post) {
                res.render('index', {
                    title: 'Dashboard | Info Point',
                    name: req.user.firstname,
                    post: post,
                    postedDate: postedDate,
                    postedBy: postedBy
                });
            } else {
                console.log(">>>No post found!");
                req.flash('error_msg', 'No posts in database!');
                res.redirect('/');
            }
    });
});

module.exports = router;