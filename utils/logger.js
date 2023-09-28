'use strict';

const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'app.log' }),
    ],
});

module.exports = logger;

