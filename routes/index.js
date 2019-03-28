const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, (req, res) => {
    res.render('index', {
        title: 'Dashboard | Info Point',
        name: req.user.firstname
    });
});

module.exports = router;