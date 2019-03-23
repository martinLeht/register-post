const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

const app = express();

dotenv.config();

var url = process.env.MONGOLAB_URI;

mongoose.connect(url, { useNewUrlParser: true });
mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error:'));

// Set up helmet
app.use(helmet());

// Bodyparser
app.use(express.urlencoded({ 
    extended: true 
}));

// EJS view engine and static
app.use(expressLayouts);
app.use(express.static(path.join(__dirname + '/static')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(session({
    secret: 'mithrandir secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));


// Set up passport
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());


// Set global vars for flash messaging
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});


// Require all the route files
const index = require('./routes/index');
const login = require('./routes/login');
const logout = require('./routes/logout');
const register = require('./routes/register');

var server = http.createServer(app);


// All routes from URL
app.use('/', index);
app.use('/login', login);
app.use('/logout', logout);
app.use('/register', register);

const port = process.env.PORT || 8080;

server.listen(port, () => {
    console.log(`Server running at port ${port}: http://127.0.0.1:${port}`);
});

module.exports = app;