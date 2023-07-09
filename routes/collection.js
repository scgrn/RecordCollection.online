'use strict';

const mysql = require('mysql');

const express = require('express');
const router = express.Router();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

router.get('/add', (request, response) => {
    if (!request.session.loggedIn) {
        response.redirect('/');
        return;
    }
    console.log("Add: " + request.query.id);
    
    response.redirect('/home');
});

router.get('/:id', (request, response) => {
    res.send('Get page for user ' + (request.params.id));
});

module.exports = router;
