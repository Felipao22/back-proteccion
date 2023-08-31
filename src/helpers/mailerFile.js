const nodemailer = require("nodemailer")

const transporterFile = nodemailer.createTransport({
    host:"c2121789.ferozo.com",
    port: 587,
    secure: false,
    auth:{
        user: process.env.EMAIL_USER_FILE,
        pass: process.env.EMAIL_PASSWORD_FILE,
    },
    requireTLS: true,
})

module.exports = transporterFile;