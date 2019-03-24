const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

router.get('/', (req, res) => {
    if (req.user) {
        res.render('index', {
            title: 'Dashboard | Info Point',
            name: req.user.firstname
        });
    } else {
        res.render('index', {
            title: 'Dashboard | Info Point'
        });
    }
    
});

module.exports = router;