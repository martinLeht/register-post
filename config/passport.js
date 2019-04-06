const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/user');


// Export the local strategy for logging in
module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            // Match user
            User.findOne({ email: email })
                .then(user => {
                    // If there is no user with such email, mark as done with a error message to be flashed on redirect
                    if (!user) {
                        return done(null, false, { message: 'User with such email is not registered'});
                    }
                    // If user found, compare passwords with bcrypt function
                    // Match passwords
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;

                        // If passwords match, return user to session and proceed to dashboard, else redirect to login with error message.
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    // Serialize user, used in passport authentication
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
      
    // Deserialize user, used in passport authentication
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
          done(err, user);
        });
    });
}