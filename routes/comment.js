const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const Post = require('../models/post');
const Comment = require('../models/comment');


// Route to create a comment for a specific post, post id in url
router.post('/:id', ensureAuthenticated, (req, res) => {

    // Declaring all variables to create the comment
    const comment = req.body.comment;
    const postId = req.params.id;
    const userId = req.user._id;


    // if comment is empty, redirect back with error
    if (!comment) {
        req.flash('error', 'Cannot comment an empty field');
        res.redirect('/');
    } else {
        // Creating comment model
        const newComment = new Comment({
            body: comment,
            _user: userId,
            _post: postId
        });

        // Log model for debugging
        console.log(newComment);


        // Saving comment model to db, catch and log if errors
        newComment.save()
            .then(comment => {
                console.log('Successful comment submitted');
                req.flash('success_msg', 'Comment submitted');
                res.redirect('/');
            })
            .catch(err => console.log(err));
    }

});

// Route to delete a comment by its id (Only in use to the author of a post)
router.get('/delete/:id', ensureAuthenticated, (req, res) => {
    Comment.deleteOne({ "_id": req.params.id }, (err, comment) => {
        if (err) throw err;
        if(comment) {
            console.log(comment);
        }
        res.redirect('/');
    });
});


module.exports = router;