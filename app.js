// 'use strict';

const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');

require('dotenv').config()

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'static')));
//app.use(express.static('/', path.join(__dirname, '/static')));
//app.use(express.static('/users', path.join(__dirname, '/static')));

app.get('/', (request, response) => {
    // redirect to HOME if user is logged in
    if (request.session.loggedIn) {
        response.redirect('/home');
        return;
    }
    
    // render login template
    response.render("index");
});

userRouter = require('./routes/user.route.js');
app.use('/user', userRouter);

recoverRouter = require('./routes/recover.route.js');
app.use('/user', recoverRouter);

homeRouter = require('./routes/home.route.js');
app.use('/home', homeRouter);

collectionRouter = require('./routes/collection.route.js');
app.use('/', collectionRouter);

// start server
const port = 80;
app.listen(port, () => {
    console.log(new Date().toISOString() + " | Server running at port " + port);
});

