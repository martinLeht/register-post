const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const Post = require('../models/post');
const Comment = require('../models/comment');


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

    const category = req.params.category;

    Post.find({ "category": category })
        .populate({
            path: '_user',
            select: 'firstname lastname'
        })
        .exec((err, result) => {
            if(err) throw err;

            res.render('posts', {
                title: "Posts | Info Point",
                posts: result,
                category: category
            });
    });
});

// Route for fetching post by category
router.get('/find', ensureAuthenticated, (req, res) => {

    Post.find()
        .populate({
            path: '_user',
            select: 'firstname lastname'
        })
        .exec((err, result) => {
            if(err) throw err;

            res.render('posts', {
                title: "Posts | Info Point",
                posts: result
            });
    });
});


//Route for searching a post that contains a specific string in any part of post
router.post("/search", ensureAuthenticated, (req, res) => {

    let searchString = req.body.searchString.trim();
    
    if (searchString === '') {
        res.redirect('/post/find');
    } else {

        searchString = searchString.toLowerCase();
        const posts = [];
        
        Post.find()
            .populate( {
                path: '_user',
                select: 'firstname lastname'
            })
            .exec((err, result) => {
                if (err) throw err;
                result.forEach(post => {
                    if (post.title.toLowerCase().includes(searchString) || post.body.toLowerCase().includes(searchString)
                        || post.category.toLowerCase().includes(searchString)
                        || post._user.firstname.toLowerCase().includes(searchString) 
                        || post._user.lastname.toLowerCase().includes(searchString)) {
                        
                        posts.push(post);
                    }
                });

                if (posts.length > 0) {
                    
                    res.render('posts', {
                        title: "Posts | Info Point",
                        posts: posts
                    });
                } else {
                    req.flash('error_msg', 'No post found with that search word!');
                    res.redirect('/');
                }
                
        });
    }
});


// Route for deleting a post and all comments in it
router.get('/delete/:id', ensureAuthenticated, (req, res) => {

    const postId = req.params.id;

    Post.deleteOne({ "_id": postId }, (err, post) => {
        if (err) throw err;

        console.log(post);

        Comment.deleteMany({ "_post": postId }, (err, result) => {
            if (err) throw err;

            console.log(result);

            res.redirect('/');
        });

    });
});


module.exports = router;