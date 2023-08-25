'use strict';

const mysql = require('mysql');

const express = require('express');
const router = express.Router();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

router.get('/recover', (request, response) => {
    if (request.session.loggedIn) {
        response.redirect('/home');
        return;
    }

    if (!request.query.query) {
        response.render("../views/recover");
        return;
    }
    
    // TODO: check if username or email is in database
    // TODO: send email
    // TODO: or give error message
    
    response.render("../views/message", { message: "Check your email for a recovery link."});                 
});

module.exports = router;

