const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');;

router.get('/:id', ensureAuthenticated, (req, res) => {
    res.render('profile', {
        title: "Profile | Info Point"
    });
});

module.exports = router;