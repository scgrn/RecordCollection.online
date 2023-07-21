'use strict';

const mysql = require('mysql');
const express = require('express');
const fs = require('fs');

const router = express.Router();

const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const getCollection = async(user) => {
    var collection = [];

    //  read user's collection
    connection.query(`SELECT
            releases.artist,
            releases.title,
            releases.releaseID,
            collections.dateAdded
        FROM collections
        INNER JOIN releases ON (collections.releaseID=releases.releaseID)
        WHERE collections.userID=?;`, [user], function(error, results) {
        
        if (error) {
            throw error;
        }
        
        if (results.length == 0) {
            //  serve file
            response.render("../views/home", { message: message, collection: collection});
            return
        } else {
            //  sort collection by artist and then title
            for (let record of results) {
                record.sortArtist = record.artist;
                if (record.sortArtist.startsWith("The ")) {
                    record.sortArtist = record.sortArtist.substring(4);
                }
            }
                                 
            results.sort((a, b) => {
                if (a.artist == b.artist) {
                    return a.title.localeCompare(b.title);
                } else {    
                    return a.sortArtist.localeCompare(b.sortArtist);
                }
            });
            console.log(results);
        }
    });
    
    return collection;
}

router.get('/home', (request, response) => {
    if (!request.session.loggedIn) {
        response.redirect('/'); // bye now
        return;
    }

    // output username
    var message;
    if (request.session.firstLogin) {
        request.session.firstLogin = false;
        message = 'Hello, ' + request.session.username + '!';
    } else {
        message = 'Welcome back, ' + request.session.username + '!';
    }

    var collection = getCollection(request.session.userID);

    //  serve file
    response.render("../views/home", { message: message, collection: collection});
});

router.post('/search', (request, response) => {
    var Discogs = require('disconnect').Client;
    var dis = new Discogs('RecordCollection.online/1.0', {
        consumerKey: process.env.DISCOGS_CONSUMER_KEY,
        consumerSecret: process.env.DISCOGS_CONSUMER_SECRET
    });

    var results = [];
    var promises = [];

    var db = dis.database();

    db.search(request.body.searchTerms, {type: "master"}).then((data) => {
        for (let result in data.results) {
            let filename = "./static/img/thumbnails/" + data.results[result].master_id + ".jpg";

            // check if thumbnail has already been downloaded
            if (!fs.existsSync(filename)) {
                let thumbnailPromise = db.getImage(data.results[result].thumb);
                promises.push(thumbnailPromise);

                thumbnailPromise.then((thumbnailData) => {
                    fs.writeFileSync(filename, thumbnailData, 'binary');
                });
            }
            results.push({
                id: data.results[result].master_id,
                title: data.results[result].title,
                thumbnail: "img/thumbnails/" + data.results[result].master_id + ".jpg",
                coverImage: data.results[result].cover_image,
            });
        }
    }).then(() => {
        //  wait for all thumbnails to download
        Promise.all(promises).then(() => {
            var json = JSON.stringify(results);
            
            response.send(json);
            response.end();
        });
    }).catch((error) => console.log(error));
});

module.exports = router;
