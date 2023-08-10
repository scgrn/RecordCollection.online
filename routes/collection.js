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

function sortCollection(collection) {
    //  trim "The " from artist name for sorting
    for (let record of collection) {
        record.sortArtist = record.artist;
        if (record.sortArtist.toUpperCase().startsWith("THE ")) {
            record.sortArtist = record.sortArtist.substring(4);
        }
    }

    //  sort collection by artist and then title
    collection.sort((a, b) => {
        if (a.artist == b.artist) {
            return a.title.localeCompare(b.title);
        } else {    
            return a.sortArtist.localeCompare(b.sortArtist);
        }
    });
}

router.getCollectionByUserID = async(userID, callback) => {
    //  read user's collection
    connection.query(`SELECT
            releases.artist,
            releases.title,
            releases.releaseID,
            collections.dateAdded
        FROM collections
        INNER JOIN releases ON (collections.releaseID=releases.releaseID)
        WHERE collections.userID=?;`, [userID], function(error, results) {

        if (error) {
            throw error;
        }

        sortCollection(results);

        callback(results);
    });
}

router.getCollectionByUserName = async(userName, callback) => {
    //  read user's collection
    connection.query(`SELECT
            releases.artist,
            releases.title,
            releases.releaseID,
            collections.dateAdded
        FROM collections
        INNER JOIN releases ON (collections.releaseID=releases.releaseID)
        INNER JOIN users ON (users.username=?)
        WHERE collections.userID=users.id;`, [userName], function(error, results) {

        if (error) {
            throw error;
        }

        sortCollection(results);

        callback(results);
    });
}

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
        if (error) {
            throw error;
        }

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
            connection.query("INSERT INTO collections (userID, releaseID, dateAdded) VALUES (?, ?, ?)", [userID, releaseID, new Date()], function(error, results) {
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

    var userID = request.session.userID;
    var releaseID = request.query.id;

    connection.query("DELETE FROM collections WHERE userID=? AND releaseID=?", [userID, releaseID], function(error, results) {
        if (error) {
            throw error;
        }

        response.redirect('/home');
    });
});

router.get('/random', (request, response) => {
    connection.query('SELECT * FROM users', function(error, results) {
        var index = Math.floor(Math.random() * results.length);
        response.redirect('/' + results[index].username);
    });
});

router.get('/:username', (request, response) => {
    connection.query('SELECT * FROM users WHERE username = ?', [request.params.username], function(error, results) {
        if (error) {
            throw error;
        }
        
        // check if the account exists
        if (results.length > 0) {
            var collection = collectionRouter.getCollectionByUserName(request.params.username, (collection) => {
                //  serve file
                response.render("../views/collection", { username: request.params.username, collection: collection});
            });
        } else {
            // TODO: 404
        }
    });
});

module.exports = router;
