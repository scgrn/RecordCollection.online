'use strict';

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const connection = require('../utils/db.js');
const sendEmail = require('../utils/email.js');
const logger = require('../utils/logger.js');
const ejs = require("ejs");

require('dotenv').config()

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

const router = express.Router();

router.post('/register', function(request, response) {
    let username = request.body.username;
    let email = request.body.email;
    let password = request.body.password;
    let confirmPassword = request.body.confirmPassword;
    
    //  check username valid
    if (username.length < 1) {
        response.send({message: 'Username cannot be blank!', code: 1});
        response.end();
        
        return;
    }
    const restricted = ["home", "random"];
    if (restricted.includes(username)) {
        response.send({message: 'Username not available', code: 1});
        response.end();

        return;
    }

    //  check email looks like an email
    if (!email.includes('@') || email.length < 3) {
        response.send({message: 'Invalid email', code: 1});
        response.end();
        
        return;
    }

    //  check password meets requirements
    if (password.length < 8) {
        response.send({message: 'Password must be at least 8 characters', code: 1});
        response.end();
        
        return;
    }
    if (password != confirmPassword) {
        response.send({message: 'Passwords do not match', code: 1});
        response.end();
        
        return;
    }
    
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(error, results, fields) {
        if (error) {
            console.error(error.stack);
        }
        
        //  check if email address is in use
        if (results.length > 0) {
            response.send({message: 'Email address already in use', code: 1});
            response.end();
            
            return;
        } else {
            connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
                if (error) {
                    console.error(error.stack);
                }
                
                // check if username is taken
                if (results.length > 0) {
                    response.send({message: 'Username not available', code: 1});
                    response.end();
                } else {
                    // convert a random number to base64 for an activation code 
                    // node doesn't have btoa :(
                    let verificationCode = Buffer.from(Math.random().toString()).toString('base64').replace(/=/g, '');

                    bcrypt.hash(password, 10, function(err, hash) {
                        // send email
                        var url = 'https://recordcollection.online/user/verify?code=' + verificationCode;
                        ejs.renderFile(path.join(__dirname, "../views/email/verify.email.ejs"), {
                            username: username,
                            url: url
                        }).then(result => {
                            sendEmail(email, 'Welcome to RecordCollection.online | Account Successfully Created', result);

                            //  write new user to DB
                            connection.query("INSERT INTO users SET ?", {
                                username: username,
                                password: hash,
                                email: email,
                                dateCreated: new Date(),
                                activationCode: verificationCode
                            }, function(error, results) {
                                if (error) {
                                    console.error(error.stack);
                                }
                                response.redirect('/user/verify');
                            });
                        });
                    });
                }
            });
        }
    });
});

router.post('/auth', function(request, response) {
    logger.info(JSON.stringify(request.session));

    const badLoginMessage = "Incorrect username or password";
    
    let username = request.body.username;
    let password = request.body.password;
    
    // ensure the input fields exists and are not empty
    if (username && password) {
        connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
            if (error) {
                console.error(error.stack);
            }
            
            // if the account exists
            if (results.length > 0) {
                bcrypt.compare(password, results[0].password, function(err, result) {
                    if (result) {
                        // check user is verified
                        if (results[0].activationCode != '') {
                            response.redirect('/user/unverified');
                            return;
                        }

                        //  password is valid, authenticate user
                        request.session.loggedIn = true;
                        request.session.username = results[0].username;
                        request.session.userID = results[0].id;
                        request.session.email = results[0].email;
                        request.session.dateCreated = results[0].dateCreated;
                        request.session.firstLogin = results[0].firstLogin == 1;
                        request.session.save();
                        
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

router.post('/changePassword', function (request, response) {
    if (!request.session.username) {
        response.redirect('/');
        return;
    }
    
    let password = request.body.password;
    let confirmPassword = request.body.confirmPassword;
    
    //  check password meets requirements
    if (password.length < 8) {
        response.send({message: 'Password must be at least 8 characters', code: 1});
        response.end();
        
        return;
    }
    if (password != confirmPassword) {
        response.send({message: 'Passwords do not match', code: 1});
        response.end();
        
        return;
    }
    
    bcrypt.hash(password, 10, function(err, hash) {
        //  write hashed new password to database
        connection.query('UPDATE users SET password = ? WHERE username = ?', [hash, request.session.username], function(error, results, fields) {
            if (error) {
                console.error(error.stack);
            }
            response.send({message: "Your password has been changed.", code: 0});
        });
    });
});

router.get('/verify', function(request, response) {
    let verificationCode = request.query.code;
    
    if (verificationCode == undefined) {
        response.render("../views/message", { message: "Check your email for a verification link!"});                 
        return;
    }

    connection.query('SELECT * FROM users WHERE activationCode = ?', [verificationCode], function(error, results, fields) {
        if (error) {
            console.error(error.stack);
        }

        if (results.length > 0) {
            connection.query('UPDATE users SET activationCode = "" WHERE activationCode= ?', [verificationCode], function(error, results, fields) {
                if (error) {
                    console.error(error.stack);
                }
                response.redirect('/user/welcome');
            });                
        } else {
            response.status(404);
            response.render("../views/message", { message: "404: NOT FOUND"});
        }
    });
});

router.get('/unverified', function(request, response) {
    response.render("../views/message", { message: "Account not verified yet - check your email!"});
});

router.get('/welcome', function(request, response) {
    response.render("../views/message", { message: "You are now verified and can log in!"});
});

router.get('/logout', function(request, response) {
    request.session.loggedIn = false;
    request.session.username = null;
    request.session.userID = null;
    request.session.destroy(error => {
        if (error) {
            return res.redirect('/home');
        }
        sessionStore.close();
        response.clearCookie('connect.sid', {path: '/', domain: 'recordcollection.online'});

        response.redirect('/');
    });
});

router.get('/delete', function(request, response) {
    connection.query('DELETE FROM users WHERE id = ?', [request.session.userID], function(error, results, fields) {
        if (error) {
            console.error(error.stack);
        }
    });
                
    connection.query('DELETE FROM collections WHERE userID = ?', [request.session.userID], function(error, results, fields) {
        if (error) {
            console.error(error.stack);
        }
    });

    request.session.loggedIn = false;
    request.session.username = null;
    request.session.userID = null;
    request.session.destroy(error => {
        if (error) {
            return res.redirect('/home');
        }
        sessionStore.close();
        response.clearCookie('connect.sid', {path: '/', domain: 'recordcollection.online'});

        response.render("../views/message", { message: "Your account has been deleted."});
    });    
});

module.exports = router;

