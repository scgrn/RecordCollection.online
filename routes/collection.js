'use strict';

const mysql = require('mysql');
const fs = require('fs');

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

    var Discogs = require('disconnect').Client;
    var dis = new Discogs('RecordCollection.online/1.0', {
        consumerKey: process.env.DISCOGS_CONSUMER_KEY,
        consumerSecret: process.env.DISCOGS_CONSUMER_SECRET
    });
    var db = dis.database();

    var userID = request.session.userID;
    var releaseID = request.query.id;

    //  check if release is already in DB
    connection.query('SELECT * FROM releases WHERE releaseID = ?', [releaseID], function(error, results) {
        if (results.length == 0) {
            db.getMaster(releaseID).then((masterData) => {
                var artist = "UNKNOWN";
                if (masterData.artists) {
                    artist = masterData.artists[0].name;
                }
                
                var release = {
                    releaseID: releaseID,
                    artist: artist,
                    title: masterData.title,
                    dateAdded: new Date()
                };

                connection.query("INSERT INTO releases SET ?", release, function(error, results) {
                    if (error) {
                        throw error;
                    }
                });
                
                //  download cover image
                let filename = "./static/img/covers/" + request.query.id + ".jpg";

                db.getImage(request.query.coverImage).then((coverImageData) => {
                    fs.writeFileSync(filename, coverImageData, 'binary');
                });
            });
        }
    });
    
    //  add to collection if not already added
    connection.query("SELECT * FROM collections WHERE userID=? AND releaseID=?", [userID, releaseID], function(error, result) {
        if (error) {
            throw error;
        }

        if (result.length == 0) {
            //  add record to collection
            connection.query("INSERT INTO collections (userID, releaseID) VALUES (?, ?)", [userID, releaseID], function(error, results) {
                if (error) {
                    throw error;
                }
                response.redirect('/home');
            });
        } else {
            //  record already in collection
            response.redirect('/home');
        }
    });
});

router.get('/remove', (request, response) => {
    if (!request.session.loggedIn) {
        response.redirect('/');
        return;
    }
    console.log("Remove: " + request.query.id);
    
    response.redirect('/home');
});

router.get('/:id', (request, response) => {
    res.send('Get page for user ' + (request.params.id));
});

module.exports = router;
