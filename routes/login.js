const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/', (req, res) => {
    res.render('login', {
        title: 'Login | Info Point'
    });
});

router.post('/', (req, res) => {

});


module.exports = router;