// 1. Import the tools we installed
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
// const bodyParser = require('body-parser');
const serviceAccount = require('./serviceAccountKey.json');
require('dotenv').config();



admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

// 2. Initialize the app
const app = express();

// 3. Set up middleware (plugins)
app.use(cors()); // Allow frontend to talk to this backend
app.use(express.json()); // Allow the backend to understand JSON data sent in requests

// Friendly JSON parse errors instead of a raw stack trace
app.use((err, req, res, next) => {
	if (err && err instanceof SyntaxError && 'body' in err) {
		return res.status(400).json({
			error: 'Invalid JSON payload. Use double quotes for all keys and string values.'
		});
	}
	next(err);
});

// 4. Create your first "Route" (an endpoint)
app.get('/api/admin', (req, res) => {
	// req = The request from the user
	// res = The response we send back
	res.json({ message: "The backend is alive!" });
});

app.post('/api/admin/create-user', async (req, res) => {
	try {
		const {email, role} = req.body;
		if (!email || !role) {
			return res.status(400).json({ error: 'email and role are required.' });
		}
		const tempPassword = Math.random().toString(36).slice(-8);
		const userRecord = await admin.auth().createUser({
			email: email,
			password: tempPassword,
		});
		await admin.firestore().collection('users').doc(userRecord.uid).set({
			email: email,
			role: role,
			requirePasswordChange: true,
			createdAt: new Date()
		});

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD
			}
		});
		const mailOptions = {
			from: 'sender mail',
			to: userRecord.email,
			subject: 'EduVenture Temporary Password',
			text: `Welcome to EduVenture, here is your temporary password "${tempPassword}", please change it when you sign in`,
		};

		let emailStatus = 'sent';
		try {
			const info = await transporter.sendMail(mailOptions);
			console.log('Email sent:', info.response);
		} catch (mailError) {
			emailStatus = 'failed';
			console.error('Error occurred while sending email:', mailError);
		}

		return res.status(201).json({
			message: 'User created successfully!',
			uid: userRecord.uid,
			temporaryPassword: tempPassword,
			emailStatus
		});
	} catch (error) {
		console.error("Error creating user:", error);
		res.status(500).json({ error: error.message});
	}
});

// 5. Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
