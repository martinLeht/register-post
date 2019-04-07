const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const Post = require('../models/post');
const Comment = require('../models/comment');


// Route to get form for creating a post
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('createPost', {
        title: 'Create Post | Info Point'
    });
});


// Route for creating a post
router.post('/', ensureAuthenticated, (req, res) => {

    // Assigning post input data to variables from request body
    const {
        postTitle,
        category,
        textBody,
    } = req.body;

    // Error messages set in this on the data verification
    let errors = [];

    // Check if any input data was empty, if so push error message to errors
    if (!postTitle || !category || !textBody) {
        console.log("Title: " + postTitle);
        console.log("Body: " + textBody);
        console.log("Category: " + category);
        errors.push({ msg: 'Fill all fields to share a post' });
    } 
    
    // if any errors from first layer of verification, render create form with appropriate errors
    if (errors.length > 0) {
        res.render('createPost', {
            title: 'Create Post | Info Point',
            errors: errors,
            postTitle: postTitle,
            category: category,
            textBody: textBody
        });
    } else {

        // assign user id of current user to dedicated variable
        const userId = req.user._id;

        // Creating db model of a post
        const newPost = new Post({
            title: postTitle,
            category: category,
            body: textBody,
            _user: userId
        });
        
        // Save newly created post to database and catch error if any errors occure
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

    // Find posts according to specific category and populate the users name who created the post
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

    // Fetch all posts and populate the users name who created the post
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
router.get("/search", ensureAuthenticated, (req, res) => {

    // Trim the trailing and leading whitespaces from search string
    let searchString = req.query.searchString.trim();
    
    if (searchString === '') {
        res.redirect('/post/find');
    } else { // if string is not empty

        // make search string to lowercase before comparison
        searchString = searchString.toLowerCase();
        const posts = [];
        
        // fetch post and populate first name and last name of user incase one searches for specific users posts
        Post.find()
            .populate( {
                path: '_user',
                select: 'firstname lastname'
            })
            .exec((err, result) => {
                if (err) throw err;

                // Increment through all String fields and compare if it matches with search substring
                // if match pushes in to posts array that is passed to rendering view
                result.forEach(post => {
                    if (post.title.toLowerCase().includes(searchString) || post.body.toLowerCase().includes(searchString)
                        || post.category.toLowerCase().includes(searchString)
                        || post._user.firstname.toLowerCase().includes(searchString) 
                        || post._user.lastname.toLowerCase().includes(searchString)) {
                        
                        posts.push(post);
                    }
                });

                // If posts found, render posts page, else redirect to dashboard with appropriate flash message
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


// Route to get and view a specific post by its id
router.get('/view/:id', ensureAuthenticated,(req, res) => {

    const postId = req.params.id;

    // Fetching post by supplied id and populating user first name and last name
    Post.findOne( { "_id": postId })
        .populate({
            path: "_user",
            select: "firstname lastname"
        })
        .exec((err, post) => {

            if (err) throw err;

            // Log post for debugging
            console.log(post);

            // If no post found, redirect to view with list of all posts
            if (!post) {
                console.log("No post with the id of " + postId + " was found in the database.");
                res.redirect('/find');
            } else { // else fetch all comments to the found post
                
                Comment.find({ "_post": post._id })
                    .populate({
                        path: "_user",
                        select: "firstname lastname"
                    })
                    .exec((err, comments) => {
                        
                        if (err) throw err;

                        console.log(comments);

                        // Format the date for the post
                        const postDate = (post.date.getMonth() + 1) + '/' + post.date.getDate() + '/' +  post.date.getFullYear();                        

                        res.render('viewPost', {
                            title: "View Post | Info Point",
                            post: post,
                            postedDate: postDate,
                            comments: comments
                        });

                    });
                
            }
    });
});


module.exports = router;