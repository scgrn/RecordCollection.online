'use strict';

const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
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

router.generateQRcode = (username) => {
    console.log("Generate QR code for user: " + username);

    var QRCode = require("qrcode-svg");
    var qrcode = new QRCode({
        content: "https://RecordCollection.online/" + username,
        padding: 4,
        width: 256,
        height: 256,
        color: "#000000",
        background: "#ffffff",
        ecl: "M",
    });
    qrcode.save("./static/img/qrCodes/" + username + ".svg", function(error) {
        if (error) {
            throw error;
        }
    });
}

function sendVerificationEmail(emailAddress, verificationCode) {
    var nodemailer = require('nodemailer');
    
    var transporter = nodemailer.createTransport({
        host: "smtp.dreamhost.com",
        port: 465,
        auth: {
            user: process.env.EMAIL_LOGIN,
            pass: process.env.EMAIL_PASSWORD,
        },
        secure: true,
        logger: true,
        debug: true,
    });
    
    var mailOptions = {
        from: 'noreply@recordcollection.online',
        to: emailAddress,
        subject: 'Complete your RecordCollection.online registration',
        html: '<a href="https://recordcollection.online/verify?code=' + verificationCode + '">Verification link</a>'
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    }); 
}

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
    const restricted = ["add", "remove", "admin", "contact", "img", "auth", "register", "random", "verify", "logout", "demo", "test"];
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
            throw error;
        }
        
        //  check if email address is in use
        if (results.length > 0) {
            response.send({message: 'Email address already in use', code: 1});
            response.end();
            
            return;
        } else {
            connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
                if (error) {
                    throw error;
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
                        sendVerificationEmail(email, verificationCode);

                        //  write new user to DB
                        connection.query("INSERT INTO users SET ?", {
                            username: username,
                            password: hash,
                            email: email,
                            dateCreated: new Date(),
                            activationCode: verificationCode
                        }, function(error, results) {
                            if (error) {
                                throw error;
                            }
                            response.redirect('/verify');
                        });
                    });
                }
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
                        // check user is verified
                        if (results[0].activationCode != '') {
                            response.redirect('/deny');
                            return;
                        }

                        //  password is valid, authenticate user
                        request.session.loggedIn = true;
                        request.session.username = results[0].username;
                        request.session.userID = results[0].id;
                        request.session.email = results[0].email;
                        request.session.dateCreated = results[0].dateCreated;
                        request.session.firstLogin = results[0].firstLogin == 1;

                        console.log(request.session.firstLogin);

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

router.get('/verify', function(request, response) {
    let verificationCode = request.query.code;
    
    if (verificationCode == undefined) {
        response.render("../views/message", { message: "Check your email for a verification link!"});                 
        return;
    }

    connection.query('SELECT * FROM users WHERE activationCode = ?', [verificationCode], function(error, results, fields) {
        if (error) {
            throw error;
        }

        if (results.length > 0) {
            connection.query('UPDATE users SET activationCode = "" WHERE activationCode= ?', [verificationCode], function(error, results, fields) {
                if (error) {
                    throw error;
                }
                response.redirect('/welcome');
            });                
        } else {
            response.render("../views/message", { message: "404: NOT FOUND"});
        }
    });
});

router.get('/deny', function(request, response) {
    response.render("../views/message", { message: "Not verified yet - check your email!"});
});

router.get('/welcome', function(request, response) {
    response.render("../views/message", { message: "You are now verified and can log in!"});
});

router.get('/logout', function(request, response) {
    request.session.loggedIn = false;
    request.session.username = null;
    request.session.userID = null;

    response.redirect('/');
});

router.get('/delete', function(request, response) {
    connection.query('DELETE FROM users WHERE id = ?', [request.session.userID], function(error, results, fields) {
        if (error) {
            throw error;
        }
    });
                
    connection.query('DELETE FROM collections WHERE userID = ?', [request.session.userID], function(error, results, fields) {
        if (error) {
            throw error;
        }
    });

    request.session.loggedIn = false;
    request.session.username = null;
    request.session.userID = null;

    response.render("../views/message", { message: "Your account has been deleted."});
});

module.exports = router;

