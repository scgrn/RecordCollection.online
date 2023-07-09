'use strict';

const express = require('express');
const fs = require('fs');

const router = express.Router();

router.get('/home', (request, response) => {
    if (request.session.loggedIn) {
        // output username
        var message;
        if (request.session.firstLogin) {
            request.session.firstLogin = false;
            message = 'Hello, ' + request.session.username + '!';
        } else {
            message = 'Welcome back, ' + request.session.username + '!';
        }
        
        // serve file
        response.render("../views/home", { message: message });
    } else {
        // not logged in
        console.log("NOT LOGGED IN, REDIRECTING HOME.");
        response.redirect('/');
    }
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
