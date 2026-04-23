const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home');
});

// Handle email sending
app.post('/send-email', (req, res) => {
    const { recipient, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Define the email options
    const mailOptions = {
        from: 'sender mail',
        to: recipient,
        subject: subject,
        text: message,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error occurred:", error);
            res.status(500).send(`Error in sending email: ${error.message}`);
        } else {
            console.log('Email sent:', info.response);
            res.send('Email sent successfully!');
        }
    });
});

app.listen(PORT, () => {
    console.log(`App is running on http://localhost:${PORT}`);
});
