const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    host:"c2121789.ferozo.com",
    port: 587,
    secure: false,
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    requireTLS: true,
})

module.exports = transporter;