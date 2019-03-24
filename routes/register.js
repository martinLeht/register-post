const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('register', {
        title: "Register | Info Point"
    });
});

router.post('/', (req, res) => {
    const {
        firstname,
        lastname,
        email,
        password,
        confirmPass
    } = req.body;
    let errors = [];

    // Check fields
    if (!name || !email || !password || !confirmPass) {
        errors.push({msg: 'Please fill in all fields'})
    }

    // Check if passwords match
    if (password !== confirmPass) {
        errors.push({msg: 'Passwords do not match'})
    }

    // Check password length
    if (password.length < 6) {
        errors.push({msg: 'Password has to be atleast 6 characters'});
    }

    if(errors.length >0) {
        res.render('register', {
            title: "Register | Info Point",
            errors: errors
        });
    } else {
        req.flash("success_msg");
        res.redirect("/login");
    }
});

module.exports = router;