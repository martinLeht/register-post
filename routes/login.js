const express = require('express');
const router = express.Router();
const passport = require('passport');

// Render login page
router.get('/', (req, res) => {
    res.render('login', {
        title: 'Login | Info Point'
    });
});

// Route for logging in and use passport for authentication
router.post('/', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

module.exports = router;