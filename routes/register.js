const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');

// Route for rendering the registration form
router.get('/', (req, res) => {
    res.render('register', {
        title: "Register | Info Point"
    });
});

// Route for creating and registering a user
router.post('/', (req, res) => {
    // Declare variables from request body
    const {
        firstname,
        lastname,
        email,
        password,
        confirmPass
    } = req.body;
    let errors = [];

    // Check fields
    if (!firstname || !lastname || !email || !password || !confirmPass) {
        errors.push({msg: 'Please fill in all fields'});
    }

    // Check if passwords match
    if (password !== confirmPass) {
        errors.push({msg: 'Passwords do not match'});
    }

    // Check password length
    if (password.length < 6) {
        errors.push({msg: 'Password has to be atleast 6 characters'});
    }

    // if errors render page
    if(errors.length > 0) {
        res.render('register', {
            title: "Register | Info Point",
            errors: errors,
            firstname,
            lastname,
            email
        });
    } else {

        // All validations passed
        User.findOne({ email: email})
            .then(user => {
                // If user already registered with given email, redirect with error message
                if (user) {
                    errors.push({msg: 'User with this email is already registered'});
                    res.render('register', {
                        title: "Register | Info Point",
                        errors: errors,
                        firstname,
                        lastname
                    });
                } else {

                    // Create user model
                    const newUser = new User( {
                        firstname,
                        lastname,
                        email,
                        password
                    });

                    console.log(newUser);

                    // Hash the password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            
                            // Set users password equal to hash and save the user
                            newUser.password = hash;
                            
                            newUser.save()
                                .then(user => {
                                    req.flash("success_msg", "Successfully registered! You may login now.");
                                    res.redirect("/login");
                                })
                                .catch(err => console.log(err));
                        }); 
                    });
                    
                }
            })
    }
});

module.exports = router;