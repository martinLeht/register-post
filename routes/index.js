const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, (req, res) => {
    if (req.user) {
        res.render('index', {
            title: 'Dashboard | Info Point',
            name: req.user.firstname
        });
    } else {
        res.render('login', {
            title: 'Login | Info Point'
        });
    }
    
});

module.exports = router;