const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const Post = require('../models/post');
const Comment = require('../models/comment');


router.post('/:id', ensureAuthenticated, (req, res) => {

    const comment = req.body.comment;
    const postId = req.params.id;
    const userId = req.user._id;
    console.log(comment);

    // if comment is empty, redirect back with error
    if (!comment) {
        req.flash('error', 'Cannot comment an empty field');
        res.redirect('/');
    } else {
        const newComment = new Comment({
            body: comment,
            _user: userId,
            _post: postId
        });

        console.log(newComment);


        // Saving comment to db
        newComment.save()
            .then(comment => {
                console.log('Successful comment submitted');
                req.flash('success_msg', 'Comment submitted');
                res.redirect('/');
            })
            .catch(err => console.log(err));
    }

});


module.exports = router;