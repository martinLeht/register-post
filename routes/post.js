const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const Post = require('../models/post');


router.get('/', ensureAuthenticated, (req, res) => {
    res.render('createPost', {
        title: 'Create Post | Info Point'
    });
});

router.post('/', ensureAuthenticated, (req, res) => {
    const {
        postTitle,
        category,
        textBody,
    } = req.body;

    let errors = [];

    if (!postTitle || !category || !textBody) {
        console.log("Title: " + postTitle);
        console.log("Body: " + textBody);
        console.log("Category: " + category);
        errors.push({ msg: 'Fill all fields to share a post' });
    } 
    
    if (errors.length > 0) {
        res.render('createPost', {
            title: 'Create Post | Info Point',
            errors: errors,
            postTitle: postTitle,
            category: category,
            textBody: textBody
        });
    } else {
        const userId = req.user._id;
        console.log(userId);

        const newPost = new Post({
            title: postTitle,
            category: category,
            body: textBody,
            _user: userId
        });
        
        newPost.save()
            .then(post => {
                req.flash('success_msg', 'Successfully shared a post! You can view it below.');
                res.redirect('/');
            })
            .catch(err => console.log(err));
       
    }

});


// Route for fetching post by category
router.get('/find/:category', ensureAuthenticated, (req, res) => {

    posts = [];
    const category = req.params.category;

    Post.find({ "category": category })
        .populate({
            path: '_user',
            select: 'firstname lastname'
        })
        .exec((err, result) => {
            if(err) throw err;
            
            result.forEach(post => {
                posts.push(post);
            });

            res.render('posts', {
                title: "Posts | Info Point",
                posts: posts,
                category: category
            });
    });
});

// Route for fetching post by category
router.get('/find', ensureAuthenticated, (req, res) => {

    posts = [];
    comments = [];

    Post.find()
        .populate({
            path: '_user',
            select: 'firstname lastname'
        })
        .exec((err, result) => {
            if(err) throw err;
            
            result.forEach(post => {
                posts.push(post);
            });

            res.render('posts', {
                title: "Posts | Info Point",
                posts: posts
            });
    });
});


module.exports = router;