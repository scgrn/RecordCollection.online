'use strict';

const mysql = require('mysql');
const bcrypt = require('bcryptjs');

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

    let query = request.query.query;
    if (!query) {
        response.render("../views/recover");
        return;
    }

    //  check if username or email is in database
    connection.query('SELECT email FROM users WHERE username = ? OR email = ?;', [query, query], function(error, results, fields) {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            //  write hashed token to database
            let token = Buffer.from(Math.random().toString()).toString('base64').replace(/=/g, '');

            bcrypt.hash(token, 10, function(err, hash) {
                // TODO: send email with unhashed token
            
                response.render("../views/message", { message: "Check your email for a recovery link."});
            });
        } else {
            response.render("../views/message", { message: `
                Neither username or email were found.<br/>
                <a href="/recover">Try again</a>
            `});
        }
    });
});

module.exports = router;

