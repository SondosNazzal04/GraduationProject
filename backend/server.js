const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const serviceAccount = require('./serviceAccountKey.json');
require('dotenv').config();

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();
const db = admin.firestore();

// 3. Set up middleware (plugins)
app.use(cors()); // Allow frontend to talk to this backend
app.use(express.json()); // Allow the backend to understand JSON data sent in requests

app.use((err, req, res, next) => {
	if (err && err instanceof SyntaxError && 'body' in err) {
		return res.status(400).json({
			error: 'Invalid JSON payload. Use double quotes for all keys and string values.'
		});
	}
	next(err);
});

function normalizeRole(role) {
	return String(role || '').trim().toLowerCase();
}

async function getUserRole(uid) {
	const snap = await db.collection('users').doc(uid).get();
	return snap.exists ? normalizeRole(snap.data()?.role) : null;
}

async function getUserRecord(uid) {
	const snap = await db.collection('users').doc(uid).get();
	return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function getProfileRecord(role, uid) {
	const collectionName = role === 'admin' ? 'adminProfiles' : role === 'student' ? 'studentProfiles' : null;
	if (!collectionName) {
		return null;
	}

	const snap = await db.collection(collectionName).doc(uid).get();
	return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function buildUserResponse(userRecord, profileRecord) {
	return {
		uid: userRecord.id,
		email: userRecord.email ?? null,
		role: normalizeRole(userRecord.role),
		requirePasswordChange: !!userRecord.requirePasswordChange,
		createdAt: userRecord.createdAt ?? null,
		updatedAt: userRecord.updatedAt ?? null,
		profile: profileRecord ?? null,
	};
}

async function authenticate(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;

	if (!token) {
		return res.status(401).json({ error: 'Missing auth token' });
	}

	try {
		const decoded = await admin.auth().verifyIdToken(token);
		req.user = decoded;
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

function requireRole(...allowedRoles) {
	return async (req, res, next) => {
		try {
			const uid = req.user?.uid;
			if (!uid) {
				return res.status(401).json({ error: 'Unauthenticated request' });
			}

			let role = normalizeRole(req.user?.role || req.user?.claims?.role || req.user?.firebase?.role);
			if (!role) {
				role = await getUserRole(uid);
			}

			if (!role) {
				return res.status(403).json({ error: 'User role not found' });
			}

			if (!allowedRoles.map(normalizeRole).includes(role)) {
				return res.status(403).json({ error: 'Forbidden' });
			}

			req.userRole = role;
			return next();
		} catch (error) {
			console.error('Authorization failed:', error);
			return res.status(500).json({ error: 'Authorization failed' });
		}
	};
}

// Helper function to create user in Firebase
async function createUser(email, role) {
	const normalizedRole = normalizeRole(role);
	const tempPassword = Math.random().toString(36).slice(-8);
	const userRecord = await admin.auth().createUser({
		email: email,
		password: tempPassword,
	});

	const userData = {
		email,
		role: normalizedRole,
		requirePasswordChange: true,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	await db.collection('users').doc(userRecord.uid).set(userData);

	if (normalizedRole === 'student') {
		await db.collection('studentProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	}

	if (normalizedRole === 'admin') {
		await db.collection('adminProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	}

	return { userRecord, tempPassword };
}

async function sendEmail(email, tempPassword) {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	const mailOptions = {
		from: 'sender mail',
		to: email,
		subject: 'EduVenture Temporary Password',
		text: `Welcome to EduVenture, here is your temporary password "${tempPassword}", please change it when you sign in`,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log('Email sent:', info.response);
		return 'sent';
	} catch (mailError) {
		console.error('Error occurred while sending email:', mailError);
		return 'failed';
	}
}

app.get('/api/admin', authenticate, requireRole('admin'), (req, res) => {
	res.json({ message: 'The backend is alive!' });
});

app.get('/api/admin/me', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Admin record not found' });
		}

		const profileRecord = await getProfileRecord('admin', req.user.uid);
		return res.json(buildUserResponse(userRecord, profileRecord));
	} catch (error) {
		console.error('Error loading admin profile:', error);
		return res.status(500).json({ error: 'Failed to load admin profile' });
	}
});

app.get('/api/admin/users', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const roleFilter = normalizeRole(req.query.role);
		const search = String(req.query.search || '').trim().toLowerCase();
		const snap = await db.collection('users').get();
		const users = [];

		for (const docSnap of snap.docs) {
			const data = docSnap.data();
			const role = normalizeRole(data.role);
			const email = String(data.email || '').toLowerCase();

			if (roleFilter && roleFilter !== role) {
				continue;
			}

			if (search && !email.includes(search)) {
				continue;
			}

			let profileRecord = null;
			if (role === 'admin' || role === 'student') {
				profileRecord = await getProfileRecord(role, docSnap.id);
			}

			users.push(buildUserResponse({ id: docSnap.id, ...data }, profileRecord));
		}

		return res.json({ items: users });
	} catch (error) {
		console.error('Error listing users:', error);
		return res.status(500).json({ error: 'Failed to list users' });
	}
});

app.get('/api/admin/students', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const snap = await db.collection('users').where('role', '==', 'student').get();
		const items = [];

		for (const docSnap of snap.docs) {
			const profileRecord = await getProfileRecord('student', docSnap.id);
			items.push(buildUserResponse({ id: docSnap.id, ...docSnap.data() }, profileRecord));
		}

		return res.json({ items });
	} catch (error) {
		console.error('Error listing students:', error);
		return res.status(500).json({ error: 'Failed to list students' });
	}
});

app.get('/api/admin/students/:uid', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.params.uid);
		if (!userRecord || normalizeRole(userRecord.role) !== 'student') {
			return res.status(404).json({ error: 'Student not found' });
		}

		const profileRecord = await getProfileRecord('student', req.params.uid);
		return res.json(buildUserResponse(userRecord, profileRecord));
	} catch (error) {
		console.error('Error loading student profile:', error);
		return res.status(500).json({ error: 'Failed to load student profile' });
	}
});

app.get('/api/student/me', authenticate, requireRole('student'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Student record not found' });
		}

		const profileRecord = await getProfileRecord('student', req.user.uid);
		return res.json(buildUserResponse(userRecord, profileRecord));
	} catch (error) {
		console.error('Error loading student profile:', error);
		return res.status(500).json({ error: 'Failed to load student profile' });
	}
});

app.post('/api/admin/create-user', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const { email, role } = req.body;
		const normalizedRole = normalizeRole(role);
		const allowedRoles = ['admin', 'student', 'parent', 'teacher'];

		if (!email || !normalizedRole) {
			return res.status(400).json({ error: 'email and role are required.' });
		}

		if (!allowedRoles.includes(normalizedRole)) {
			return res.status(400).json({ error: 'Invalid role.' });
		}

		const { userRecord, tempPassword } = await createUser(email, normalizedRole);
		await admin.auth().setCustomUserClaims(userRecord.uid, { role: normalizedRole });
		const emailStatus = await sendEmail(userRecord.email, tempPassword);

		return res.status(201).json({
			message: 'User created successfully!',
			uid: userRecord.uid,
			role: normalizedRole,
			temporaryPassword: tempPassword,
			emailStatus,
		});
	} catch (error) {
		console.error('Error creating user:', error);
		return res.status(500).json({ error: error.message });
	}
});

// 5. Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
