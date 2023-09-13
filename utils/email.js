'use strict';

const nodemailer = require('nodemailer');

var sendEmail = (emailAddress, subject, body) => {
    var transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_LOGIN,
            pass: process.env.EMAIL_PASSWORD,
        },
        secure: true,
        logger: true,
        debug: false,
    });
    
    var mailOptions = {
        from: 'noreply@recordcollection.online',
        to: emailAddress,
        subject: subject,
        html: body
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error(error.stack);
        } else {
            console.log('Email sent: ' + info.response);
        }
    }); 
}

module.exports = sendEmail;

