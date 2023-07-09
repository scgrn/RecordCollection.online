'use strict';

const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

require('dotenv').config()

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const router = express.Router();

router.post('/register', function(request, response) {
    let username = request.body.username;
    let email = request.body.email;
    let password = request.body.password;
    let confirmPassword = request.body.confirmPassword;
    
    if (password != confirmPassword) {
        response.send('Passwords do not match');
        response.end();
        
        return;
    }
    
    const restricted = ["add", "remove", "admin", "contact", "img", "auth", "register", "logout", "test"];
    if (restricted.includes(username)) {
        response.send('Username not available');
        response.end();

        return;
    }

    connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
        if (error) {
            throw error;
        }
        
        // check if the account exists
        if (results.length > 0) {
            response.send('Username not available');
            response.end();
        } else {
            bcrypt.hash(password, 10, function(err, hash) {
                // store hash in the database
                console.log(hash);
            });
        }
    });
});

router.post('/auth', function(request, response) {
    const badLoginMessage = "Incorrect username or password";
    
    let username = request.body.username;
    let password = request.body.password;
    
    // ensure the input fields exists and are not empty
    if (username && password) {
        connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
            if (error) {
                throw error;
            }
            
            // if the account exists
            if (results.length > 0) {
                bcrypt.compare(password, results[0].password, function(err, result) {
                    if (result) {
                        //  password is valid, authenticate user
                        request.session.loggedIn = true;
                        request.session.username = username;
                        request.session.userID = results[0].id;

                        //  redirect to home page
                        response.redirect('/home');
                    } else {
                        //  incorrect password
                        response.send({message: badLoginMessage, code: 1});
                    }
                    response.end();
                });
            } else {
                //  unknown username
                response.json({message: badLoginMessage, code: 1});
                response.end();
            }            
        });
    } else {
        //  empty field(s)
        response.json({message: 'Please enter both username and password.', code: 1});
        response.end();
    }
});

router.get('/logout', function(request, response) {
    request.session.loggedIn = false;
    request.session.username = null;

    response.redirect('/');
});

module.exports = router;
