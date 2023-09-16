'use strict';

const bcrypt = require('bcryptjs');
const express = require('express');
const connection = require('../utils/db.js');
const path = require('path');
const sendEmail = require('../utils/email.js');
const ejs = require("ejs");

const router = express.Router();

router.get('/recover', (request, response) => {
    if (request.session.loggedIn) {
        response.redirect('/home');
        return;
    }

    let token = request.query.token;
    if (token) {
        // compute hash
        bcrypt.hash(password, 10, function(err, hash) {        
            // check if hashed token is in DB
            connection.query('SELECT id, username FROM users WHERE recoveryToken = ?;', [hash], function(error, results, fields) {
                if (error) {
                    console.error(error.stack);
                }
                    
                if (result) {
                    // show reset password form
                    request.session.username = result[0].username;
                    request.session.usedID = result[0].userID;
                    request.session.loggedIn = false;
                    
                } else {
                    // token not found, throw a 404
                    
                }
                
            });
        });
    }
    
    let query = request.query.query;
    if (!query) {
        response.render("../views/recover");
        return;
    }

    //  check if username or email is in database
    connection.query('SELECT id, username, email FROM users WHERE username = ? OR email = ?;', [query, query], function(error, results, fields) {
        if (error) {
            console.error(error.stack);
        }

        if (results.length > 0) {
            let token = Buffer.from(Math.random().toString()).toString('base64').replace(/=/g, '');

            bcrypt.hash(token, 10, function(err, hash) {
                // write hashed token to DB
                connection.query('UPDATE users SET recoveryToken = ? WHERE id = ?', [hash, results[0].id], function(error, results, fields) {
                    if (error) {
                        console.error(error.stack);
                    }
                });

                // send email with unhashed token
                var url = 'https://recordcollection.online/user/recover?token=' + token;
                ejs.renderFile(path.join(__dirname, "../views/email/recover.email.ejs"), {
                    username: results[0].username,
                    url: url
                }).then(result => {
                    sendEmail(results[0].email, 'RecordCollection.online | Account Recovery', result);
                });

                response.render("../views/message", { message: "Check your email for a recovery link."});
            });
        } else {
            response.render("../views/message", { message: `
                Neither username or email were found.<br/>
                <a href="/user/recover">Try again</a>
            `});
        }
    });
});

module.exports = router;

