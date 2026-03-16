// 1. Import the tools we installed
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

// 2. Initialize the app
const app = express();

// 3. Set up middleware (plugins)
app.use(cors()); // Allow frontend to talk to this backend
app.use(express.json()); // Allow the backend to understand JSON data sent in requests

// 4. Create your first "Route" (an endpoint)
app.get('/api/admin', (req, res) => {
	// req = The request from the user
	// res = The response we send back
	res.json({ message: "The backend is alive!" });
});

app.post('/api/admin/create-user', async (req, res) => {
	try {
		const {email, role} = req.body;
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

		res.status(201).json({
			message: "User created successfully!",
			uid: userRecord.uid,
			temporaryPassword: tempPassword
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
