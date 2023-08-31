'use strict';

const QRCode = require("qrcode-svg");

var generateQRcode = (username) => {
    console.log("Generate QR code for user: " + username);

    var qrcode = new QRCode({
        content: "https://RecordCollection.online/" + username,
        padding: 4,
        width: 256,
        height: 256,
        color: "#000000",
        background: "#ffffff",
        ecl: "M",
    });

    qrcode.save("./static/img/qrCodes/" + username + ".svg", (error) => {
        if (error) {
            console.error(error.stack);
        }
    });
}

module.exports = generateQRcode;
