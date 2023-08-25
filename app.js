const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');

require('dotenv').config()

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (request, response) => {
    // redirect to HOME if user is logged in
    if (request.session.loggedIn) {
        response.redirect('/home');
        return;
    }
    
    // render login template
    response.render("index");
});

userRouter = require('./routes/users.js');
app.use('/', userRouter);

recoverRouter = require('./routes/recover.js');
app.use('/', recoverRouter);

panelRouter = require('./routes/panel.js');
app.use('/', panelRouter);

collectionRouter = require('./routes/collection.js');
app.use('/', collectionRouter);

// start server
const port = 80;
app.listen(port, () => {
    console.log(new Date().toISOString() + " | Server running at port " + port);
});
