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

router.post('/register', function(request, response) {
    let username = request.body.username;
    let email = request.body.email;
    let password = request.body.password;
    let confirmPassword = request.body.confirmPassword;
    
    console.log("username: " + username);
    console.log("email: " + email);
    console.log("password: " + password);
    console.log("confirmPassword: " + confirmPassword);
    
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
                    bcrypt.hash(password, 10, function(err, hash) {
                        // store hash in the database
                        console.log(hash);
                        
                        // node doesn't have btoa :(
                        let verificationCode = Buffer.from(Math.random().toString()).toString('base64');
                        console.log(verificationCode);

                        // TODO: send email
                        
                        response.redirect('/verify');
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
                        //  password is valid, authenticate user
                        request.session.loggedIn = true;
                        request.session.username = results[0].username;
                        request.session.userID = results[0].id;
                        request.session.dateCreated = results[0].dateCreated;

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
    response.render("../views/message", { message: "Check your email for a verification link!"});                 
});

router.get('/logout', function(request, response) {
    request.session.loggedIn = false;
    request.session.username = null;
    request.session.userID = null;

    response.redirect('/');
});

router.get('/delete', function(request, response) {
    //  TODO: implement
    response.redirect('/');
});

module.exports = router;
