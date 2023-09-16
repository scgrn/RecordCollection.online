'use strict';

const express = require('express');
const generateQRcode = require('../utils/qr.js');
const connection = require('../utils/db.js');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/', (request, response) => {
    if (!request.session.loggedIn) {
        response.redirect('/'); // bye now
        return;
    }

    // greet user
    var message;
    if (request.session.firstLogin) {
        request.session.firstLogin = false;
        message = 'Hello, ' + request.session.username + '!';
        
        connection.query('UPDATE users SET firstLogin = FALSE WHERE id = ?', [request.session.userID], function(error, results, fields) {
            if (error) {
                console.error(error.stack);
            }
        });
    } else {
        message = 'Welcome back, ' + request.session.username + '!';
    }
    console.log(message);

    //  generate user's QR code if it doesn't exist
    if (!fs.existsSync("./static/img/qrCodes/" + request.session.username + ".svg")) {
        generateQRcode(request.session.username);
    }

    //  serve file
    var collection = collectionRouter.getCollectionByUserID(request.session.userID, (collection) => {
        request.session.numAlbums = collection.length;
        response.render("../views/home", { message: message, userName: request.session.username, collection: collection});
    });
});

router.get('/manage', (request, response) => {
    if (!request.session.loggedIn) {
        response.redirect('/'); // bye now
        return;
    }

    response.render("../views/manage", {
        userName: request.session.username,
        email: request.session.email,
        dateCreated: request.session.dateCreated.slice(0, 10),
        redirect: false
    });
});

router.post('/search', (request, response) => {
    var Discogs = require('disconnect').Client;
    var dis = new Discogs('RecordCollection.online/1.0', {
        consumerKey: process.env.DISCOGS_CONSUMER_KEY,
        consumerSecret: process.env.DISCOGS_CONSUMER_SECRET
    });

    var results = [];
    var promises = [];

    var collection = collectionRouter.getCollectionByUserID(request.session.userID, (collection) => {
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
                
                let inCollection = false;
                collection.forEach((record) => {
                    if (record.releaseID == data.results[result].master_id) {
                        inCollection = true;
                    }
                });
                
                results.push({
                    id: data.results[result].master_id,
                    title: data.results[result].title,
                    thumbnail: "img/thumbnails/" + data.results[result].master_id + ".jpg",
                    coverImage: data.results[result].cover_image,
                    inCollection: inCollection
                });
            }
        }).then(() => {
            //  wait for all thumbnails to download
            Promise.all(promises).then(() => {
                var json = JSON.stringify(results);
                
                response.send(json);
                response.end();
            });
        }).catch((error) => console.error(error.stack));
    });
});

module.exports = router;

