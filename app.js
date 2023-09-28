// 'use strict';

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const connection = require('./utils/db.js');

const path = require('path');
const favicon = require('serve-favicon');


const app = express();

const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
},connection);

app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(favicon(path.join(__dirname, 'static', '/favicon.ico')));

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (request, response) => {
    console.error(request.session);
    
    // redirect to HOME if user is logged in
    if (request.session.loggedIn) {
        response.redirect('/home');
        return;
    }
    
    // render login template
    response.render("index");
});

app.get('/privacyPolicy.html', (request, response) => {
    response.render("privacyPolicy");
});

userRouter = require('./routes/user.route.js');
app.use('/user', userRouter);

recoverRouter = require('./routes/recover.route.js');
app.use('/user', recoverRouter);

homeRouter = require('./routes/home.route.js');
app.use('/home', homeRouter);

collectionRouter = require('./routes/collection.route.js');
app.use('/', collectionRouter);

app.use((request, response, next) => {
    response.status(404);
    response.render("../views/message", { message: "404: NOT FOUND"});
});

// start server
const port = 80;
app.listen(port, () => {
    console.log(new Date().toISOString() + " | Server running at port " + port);
});

