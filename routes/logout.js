const express = require('express');
const router = express.Router();

const User = require('../models/user');

router.get('/', (req, res) => {

    // Setting datetime to when user was last online
    User.findOne({ _id: req.user._id }, (err, user) => {
        if (err) throw err;

        user.lastLogged = Date.now();

        user.save((err) => {
            if (err) throw err;
            console.log(user.lastLogged);
        });
    });
    req.logOut();
    req.flash('success_msg', 'Successfully logged out');
    res.redirect('/login');
});

module.exports = router;