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
	const collectionName = role === 'admin'
		? 'adminProfiles'
		: role === 'student'
			? 'studentProfiles'
			: role === 'teacher'
				? 'teacherProfiles'
				: role === 'parent'
					? 'parentProfiles'
					: null;
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
		pointsBalance: Number(userRecord.pointsBalance ?? profileRecord?.pointsBalance ?? 0),
		classIds: Array.isArray(profileRecord?.classIds) ? profileRecord.classIds : Array.isArray(userRecord.classIds) ? userRecord.classIds : [],
		firstName: userRecord.firstName ?? profileRecord?.firstName ?? '',
		lastName: userRecord.lastName ?? profileRecord?.lastName ?? '',
		dateOfBirth: userRecord.dateOfBirth ?? profileRecord?.dateOfBirth ?? '',
		childrenUids: Array.isArray(profileRecord?.childrenUids) ? profileRecord.childrenUids : Array.isArray(userRecord.childrenUids) ? userRecord.childrenUids : [],
		parentUid: userRecord.parentUid ?? profileRecord?.parentUid ?? null,
		createdAt: userRecord.createdAt ?? null,
		updatedAt: userRecord.updatedAt ?? null,
		profile: profileRecord ?? null,
	};
}

function normalizeClassIds(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

function normalizeAnswerValue(value) {
	return String(value ?? '').trim().toLowerCase();
}

function normalizeQuestion(question) {
	return {
		id: question.id || db.collection('activities').doc().id,
		text: String(question.text || '').trim(),
		type: String(question.type || 'mcq').trim().toLowerCase(),
		options: Array.isArray(question.options)
			? question.options.map((option) => ({
				id: option.id || db.collection('activities').doc().id,
				text: String(option.text || '').trim(),
			}))
			: [],
		correctAnswer: String(question.correctAnswer || '').trim(),
		grade: Number(question.grade || 0),
		points: Number(question.points || 0),
	};
}

function serializeActivity(docSnap) {
	if (!docSnap.exists) {
		return null;
	}

	return { id: docSnap.id, ...docSnap.data() };
}

function serializeShopItem(docSnap) {
	if (!docSnap.exists) {
		return null;
	}

	return { id: docSnap.id, ...docSnap.data() };
}

function scoreSubmission(activity, answers) {
	let totalCorrect = 0;
	let gradeScore = 0;
	let earnedPoints = 0;

	const gradedAnswers = (Array.isArray(answers) ? answers : []).map((answer) => {
		const question = activity.questions.find((item) => item.id === answer.questionId);
		if (!question) {
			return answer;
		}

		const isCorrect = normalizeAnswerValue(answer.answer) === normalizeAnswerValue(question.correctAnswer);
		const earnedGrade = isCorrect ? Number(question.grade || 0) : 0;
		const earnedQuestionPoints = isCorrect ? Number(question.points || 0) : 0;

		if (isCorrect) {
			totalCorrect += 1;
		}

		gradeScore += earnedGrade;
		earnedPoints += earnedQuestionPoints;

		return {
			...answer,
			isCorrect,
			earnedGrade,
			earnedPoints: earnedQuestionPoints,
		};
	});

	const gradePercentage = activity.totalGrade > 0 ? Math.round((gradeScore / activity.totalGrade) * 100) : 0;

	return {
		gradedAnswers,
		totalCorrect,
		gradeScore,
		gradePercentage,
		earnedPoints,
	};
}

async function adjustUserPoints(uid, delta, meta = {}) {
	const userRef = db.collection('users').doc(uid);
	const profileRef = db.collection('studentProfiles').doc(uid);
	const transactionRef = db.collection('pointTransactions').doc();

	return db.runTransaction(async (transaction) => {
		const userSnap = await transaction.get(userRef);
		if (!userSnap.exists) {
			throw new Error('User not found');
		}

		const currentBalance = Number(userSnap.data()?.pointsBalance || 0);
		const nextBalance = currentBalance + Number(delta || 0);

		if (nextBalance < 0) {
			throw new Error('Insufficient points');
		}

		transaction.update(userRef, {
			pointsBalance: nextBalance,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		transaction.set(profileRef, {
			pointsBalance: nextBalance,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		}, { merge: true });

		transaction.set(transactionRef, {
			uid,
			delta: Number(delta || 0),
			balanceAfter: nextBalance,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			...meta,
		});

		return { balanceAfter: nextBalance, transactionId: transactionRef.id };
	});
}

function sanitizeActivityPayload(payload) {
	const questions = Array.isArray(payload.questions) ? payload.questions.map(normalizeQuestion) : [];
	const totalGrade = questions.reduce((sum, question) => sum + Number(question.grade || 0), 0);
	const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);

	return {
		title: String(payload.title || '').trim(),
		description: String(payload.description || '').trim(),
		type: String(payload.type || 'quiz').trim().toLowerCase(),
		questions,
		totalGrade,
		totalPoints,
		classId: String(payload.classId || '').trim() || null,
		dueDate: payload.dueDate || null,
		timeLimit: payload.timeLimit ? Number(payload.timeLimit) : null,
		status: String(payload.status || 'published').trim().toLowerCase(),
	};
}

function sanitizeClassPayload(payload) {
	return {
		name: String(payload.name || '').trim(),
		code: String(payload.code || '').trim(),
		description: String(payload.description || '').trim(),
		gradeLevel: String(payload.gradeLevel || '').trim(),
		teacherUid: String(payload.teacherUid || '').trim() || null,
		studentUids: normalizeClassIds(payload.studentUids),
	};
}

async function syncClassMembership(uid, role, previousClassIds, nextClassIds) {
	const normalizedRole = normalizeRole(role);
	const before = new Set(normalizeClassIds(previousClassIds));
	const after = new Set(normalizeClassIds(nextClassIds));

	const removed = [...before].filter((classId) => !after.has(classId));
	const added = [...after].filter((classId) => !before.has(classId));

	for (const classId of removed) {
		const classRef = db.collection('classes').doc(classId);
		if (normalizedRole === 'teacher') {
			await classRef.set({ teacherUid: admin.firestore.FieldValue.delete() }, { merge: true });
		} else if (normalizedRole === 'student') {
			await classRef.set({ studentUids: admin.firestore.FieldValue.arrayRemove(uid) }, { merge: true });
		} else if (normalizedRole === 'parent') {
			await classRef.set({ parentUids: admin.firestore.FieldValue.arrayRemove(uid) }, { merge: true });
		}
	}

	for (const classId of added) {
		const classRef = db.collection('classes').doc(classId);
		if (normalizedRole === 'teacher') {
			await classRef.set({ teacherUid: uid }, { merge: true });
		} else if (normalizedRole === 'student') {
			await classRef.set({ studentUids: admin.firestore.FieldValue.arrayUnion(uid) }, { merge: true });
		} else if (normalizedRole === 'parent') {
			await classRef.set({ parentUids: admin.firestore.FieldValue.arrayUnion(uid) }, { merge: true });
		}
	}
}

async function getClassesForUser(uid, role) {
	const normalizedRole = normalizeRole(role);
	let classIds = [];

	if (normalizedRole === 'student') {
		const profile = await getProfileRecord('student', uid);
		classIds = normalizeClassIds(profile?.classIds);
	} else if (normalizedRole === 'teacher') {
		const profile = await getProfileRecord('teacher', uid);
		classIds = normalizeClassIds(profile?.classIds);
		const querySnap = await db.collection('classes').where('teacherUid', '==', uid).get();
		for (const docSnap of querySnap.docs) {
			classIds.push(docSnap.id);
		}
		classIds = [...new Set(classIds)];
	} else if (normalizedRole === 'parent') {
		const profile = await getProfileRecord('parent', uid);
		classIds = normalizeClassIds(profile?.classIds);
	}

	if (!classIds.length) {
		return [];
	}

	const docs = await Promise.all(classIds.map((classId) => db.collection('classes').doc(classId).get()));
	return docs.filter((docSnap) => docSnap.exists).map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function sanitizeShopItemPayload(payload) {
	return {
		name: String(payload.name || '').trim(),
		description: String(payload.description || '').trim(),
		price: Number(payload.price || 0),
		image: String(payload.image || '').trim(),
		emoji: String(payload.emoji || '').trim(),
		active: payload.active !== false,
	};
}

async function authenticate(req, res, next) {
	// Development shortcut: skip Firebase token verification when env var is set
	if (process.env.DEV_NO_AUTH === 'true') {
		req.user = {
			uid: process.env.DEV_UID || 'dev-student',
			role: process.env.DEV_ROLE || 'student',
		};
		return next();
	}
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
async function createUser(email, role, options = {}) {
	const normalizedRole = normalizeRole(role);
	const classIds = normalizeClassIds(options.classIds);
	const firstName = String(options.firstName || '').trim();
	const lastName = String(options.lastName || '').trim();
	const dateOfBirth = String(options.dateOfBirth || '').trim();
	const childrenUids = Array.isArray(options.childrenUids) ? options.childrenUids : [];
	const tempPassword = Math.random().toString(36).slice(-8);
	const userRecord = await admin.auth().createUser({
		email: email,
		password: tempPassword,
	});

	const userData = {
		email,
		role: normalizedRole,
		requirePasswordChange: true,
		pointsBalance: 0,
		classIds,
		firstName,
		lastName,
		dateOfBirth,
		...(normalizedRole === 'parent' ? { childrenUids } : {}),
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		updatedAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	await db.collection('users').doc(userRecord.uid).set(userData);

	if (normalizedRole === 'student') {
		await db.collection('studentProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			pointsBalance: 0,
			classIds,
			firstName,
			lastName,
			dateOfBirth,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	}

	if (normalizedRole === 'admin') {
		await db.collection('adminProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			pointsBalance: 0,
			classIds,
			firstName,
			lastName,
			dateOfBirth,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	}

	if (normalizedRole === 'teacher') {
		await db.collection('teacherProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			pointsBalance: 0,
			classIds,
			firstName,
			lastName,
			dateOfBirth,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});
	}

	if (normalizedRole === 'parent') {
		await db.collection('parentProfiles').doc(userRecord.uid).set({
			uid: userRecord.uid,
			email,
			status: 'active',
			pointsBalance: 0,
			classIds,
			firstName,
			lastName,
			dateOfBirth,
			childrenUids,
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

			users.push(buildUserResponse({ id: docSnap.id, ...data }, null));
		}

		return res.json({ items: users });
	} catch (error) {
		console.error('Error listing users:', error);
		return res.status(500).json({ error: 'Failed to list users' });
	}
});

app.get('/api/admin/classes', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const snap = await db.collection('classes').orderBy('createdAt', 'desc').get();
		const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
		return res.json({ items });
	} catch (error) {
		console.error('Error listing classes:', error);
		return res.status(500).json({ error: 'Failed to list classes' });
	}
});

app.post('/api/admin/classes', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const payload = sanitizeClassPayload(req.body || {});
		if (!payload.name) {
			return res.status(400).json({ error: 'name is required.' });
		}

		const docRef = db.collection('classes').doc();
		await docRef.set({
			...payload,
			studentUids: payload.studentUids,
			createdByUid: req.user.uid,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		if (payload.teacherUid) {
			const teacherProfile = await getProfileRecord('teacher', payload.teacherUid);
			const teacherClassIds = normalizeClassIds(teacherProfile?.classIds);
			const nextTeacherClassIds = [...new Set([...teacherClassIds, docRef.id])];
			await db.collection('teacherProfiles').doc(payload.teacherUid).set({ classIds: nextTeacherClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
			await db.collection('users').doc(payload.teacherUid).set({ classIds: nextTeacherClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
			await syncClassMembership(payload.teacherUid, 'teacher', teacherClassIds, nextTeacherClassIds);
		}

		for (const studentUid of payload.studentUids) {
			const studentProfile = await getProfileRecord('student', studentUid);
			const studentClassIds = normalizeClassIds(studentProfile?.classIds);
			const nextStudentClassIds = [...new Set([...studentClassIds, docRef.id])];
			await db.collection('studentProfiles').doc(studentUid).set({ classIds: nextStudentClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
			await db.collection('users').doc(studentUid).set({ classIds: nextStudentClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
			await syncClassMembership(studentUid, 'student', studentClassIds, nextStudentClassIds);
		}

		return res.status(201).json({ message: 'Class created successfully!', item: { id: docRef.id, ...payload } });
	} catch (error) {
		console.error('Error creating class:', error);
		return res.status(500).json({ error: error.message || 'Failed to create class' });
	}
});

app.put('/api/admin/users/:uid/classes', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.params.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'User not found' });
		}

		const nextClassIds = normalizeClassIds(req.body?.classIds);
		const previousClassIds = normalizeClassIds(userRecord.classIds);
		const role = normalizeRole(userRecord.role);
		const profileCollection = role === 'student' ? 'studentProfiles' : role === 'teacher' ? 'teacherProfiles' : role === 'parent' ? 'parentProfiles' : 'adminProfiles';

		await db.collection('users').doc(req.params.uid).set({ classIds: nextClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
		await db.collection(profileCollection).doc(req.params.uid).set({ classIds: nextClassIds, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
		await syncClassMembership(req.params.uid, role, previousClassIds, nextClassIds);

		return res.json({ message: 'Classes updated successfully!', classIds: nextClassIds });
	} catch (error) {
		console.error('Error updating user classes:', error);
		return res.status(500).json({ error: error.message || 'Failed to update classes' });
	}
});

app.put('/api/admin/users/:uid', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const uid = req.params.uid;
		const userRecord = await getUserRecord(uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'User not found' });
		}

		const { email, firstName = '', lastName = '', dateOfBirth = '', classIds = [], childrenUids = [] } = req.body;
		const role = normalizeRole(userRecord.role);
		const profileCollection = role === 'student' ? 'studentProfiles' : role === 'teacher' ? 'teacherProfiles' : role === 'parent' ? 'parentProfiles' : 'adminProfiles';

		const updatedUserData = {
			firstName: String(firstName || '').trim(),
			lastName: String(lastName || '').trim(),
			dateOfBirth: String(dateOfBirth || '').trim(),
			classIds: normalizeClassIds(classIds),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		if (email && email.trim() !== userRecord.email) {
			const cleanEmail = email.trim();
			await admin.auth().updateUser(uid, { email: cleanEmail });
			updatedUserData.email = cleanEmail;
		}

		if (role === 'parent') {
			const prevChildren = Array.isArray(userRecord.childrenUids) ? userRecord.childrenUids : [];
			const nextChildren = Array.isArray(childrenUids) ? childrenUids : [];
			const removedChildren = prevChildren.filter(c => !nextChildren.includes(c));
			const addedChildren = nextChildren.filter(c => !prevChildren.includes(c));

			for (const studentUid of removedChildren) {
				await db.collection('users').doc(studentUid).set({ parentUid: admin.firestore.FieldValue.delete() }, { merge: true });
				await db.collection('studentProfiles').doc(studentUid).set({ parentUid: admin.firestore.FieldValue.delete() }, { merge: true });
			}
			for (const studentUid of addedChildren) {
				await db.collection('users').doc(studentUid).set({ parentUid: uid }, { merge: true });
				await db.collection('studentProfiles').doc(studentUid).set({ parentUid: uid }, { merge: true });
			}
			updatedUserData.childrenUids = nextChildren;
		}

		await db.collection('users').doc(uid).set(updatedUserData, { merge: true });
		await db.collection(profileCollection).doc(uid).set({
			...updatedUserData,
			email: updatedUserData.email || userRecord.email,
		}, { merge: true });

		const previousClassIds = normalizeClassIds(userRecord.classIds);
		const nextClassIds = normalizeClassIds(classIds);
		await syncClassMembership(uid, role, previousClassIds, nextClassIds);

		return res.json({ message: 'User updated successfully!' });
	} catch (error) {
		console.error('Error updating user:', error);
		return res.status(500).json({ error: error.message });
	}
});

app.delete('/api/admin/users/:uid', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const uid = req.params.uid;
		const userRecord = await getUserRecord(uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'User not found' });
		}

		const role = normalizeRole(userRecord.role);
		const classIds = normalizeClassIds(userRecord.classIds);
		const profileCollection = role === 'student' ? 'studentProfiles' : role === 'teacher' ? 'teacherProfiles' : role === 'parent' ? 'parentProfiles' : 'adminProfiles';

		await admin.auth().deleteUser(uid);
		await syncClassMembership(uid, role, classIds, []);

		if (role === 'parent') {
			const childrenUids = Array.isArray(userRecord.childrenUids) ? userRecord.childrenUids : [];
			for (const studentUid of childrenUids) {
				await db.collection('users').doc(studentUid).set({ parentUid: admin.firestore.FieldValue.delete() }, { merge: true });
				await db.collection('studentProfiles').doc(studentUid).set({ parentUid: admin.firestore.FieldValue.delete() }, { merge: true });
			}
		} else if (role === 'student' && userRecord.parentUid) {
			await db.collection('users').doc(userRecord.parentUid).set({ childrenUids: admin.firestore.FieldValue.arrayRemove(uid) }, { merge: true });
			await db.collection('parentProfiles').doc(userRecord.parentUid).set({ childrenUids: admin.firestore.FieldValue.arrayRemove(uid) }, { merge: true });
		}

		await db.collection('users').doc(uid).delete();
		await db.collection(profileCollection).doc(uid).delete();

		return res.json({ message: 'User deleted successfully!' });
	} catch (error) {
		console.error('Error deleting user:', error);
		return res.status(500).json({ error: error.message });
	}
});

app.put('/api/admin/classes/:id', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const classId = req.params.id;
		const classRef = db.collection('classes').doc(classId);
		const classSnap = await classRef.get();
		if (!classSnap.exists) {
			return res.status(404).json({ error: 'Class not found' });
		}
		const prevClass = classSnap.data();
		const payload = sanitizeClassPayload(req.body || {});

		await classRef.set({
			...payload,
			updatedAt: admin.firestore.FieldValue.serverTimestamp()
		}, { merge: true });

		const prevTeacherUid = prevClass.teacherUid || null;
		const nextTeacherUid = payload.teacherUid || null;
		if (prevTeacherUid !== nextTeacherUid) {
			if (prevTeacherUid) {
				const teacherProfile = await getProfileRecord('teacher', prevTeacherUid);
				const nextClassIds = normalizeClassIds(teacherProfile?.classIds).filter(id => id !== classId);
				await db.collection('teacherProfiles').doc(prevTeacherUid).set({ classIds: nextClassIds }, { merge: true });
				await db.collection('users').doc(prevTeacherUid).set({ classIds: nextClassIds }, { merge: true });
			}
			if (nextTeacherUid) {
				const teacherProfile = await getProfileRecord('teacher', nextTeacherUid);
				const nextClassIds = [...new Set([...normalizeClassIds(teacherProfile?.classIds), classId])];
				await db.collection('teacherProfiles').doc(nextTeacherUid).set({ classIds: nextClassIds }, { merge: true });
				await db.collection('users').doc(nextTeacherUid).set({ classIds: nextClassIds }, { merge: true });
			}
		}

		const prevStudentUids = prevClass.studentUids || [];
		const nextStudentUids = payload.studentUids || [];
		const removedStudents = prevStudentUids.filter(uid => !nextStudentUids.includes(uid));
		const addedStudents = nextStudentUids.filter(uid => !prevStudentUids.includes(uid));

		for (const studentUid of removedStudents) {
			const profile = await getProfileRecord('student', studentUid);
			const nextClassIds = normalizeClassIds(profile?.classIds).filter(id => id !== classId);
			await db.collection('studentProfiles').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
			await db.collection('users').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
		}

		for (const studentUid of addedStudents) {
			const profile = await getProfileRecord('student', studentUid);
			const nextClassIds = [...new Set([...normalizeClassIds(profile?.classIds), classId])];
			await db.collection('studentProfiles').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
			await db.collection('users').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
		}

		return res.json({ message: 'Class updated successfully!', item: { id: classId, ...payload } });
	} catch (error) {
		console.error('Error updating class:', error);
		return res.status(500).json({ error: error.message });
	}
});

app.delete('/api/admin/classes/:id', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const classId = req.params.id;
		const classRef = db.collection('classes').doc(classId);
		const classSnap = await classRef.get();
		if (!classSnap.exists) {
			return res.status(404).json({ error: 'Class not found' });
		}
		const classData = classSnap.data();

		if (classData.teacherUid) {
			const teacherProfile = await getProfileRecord('teacher', classData.teacherUid);
			const nextClassIds = normalizeClassIds(teacherProfile?.classIds).filter(id => id !== classId);
			await db.collection('teacherProfiles').doc(classData.teacherUid).set({ classIds: nextClassIds }, { merge: true });
			await db.collection('users').doc(classData.teacherUid).set({ classIds: nextClassIds }, { merge: true });
		}

		const studentUids = classData.studentUids || [];
		for (const studentUid of studentUids) {
			const profile = await getProfileRecord('student', studentUid);
			const nextClassIds = normalizeClassIds(profile?.classIds).filter(id => id !== classId);
			await db.collection('studentProfiles').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
			await db.collection('users').doc(studentUid).set({ classIds: nextClassIds }, { merge: true });
		}

		await classRef.delete();
		return res.json({ message: 'Class deleted successfully!' });
	} catch (error) {
		console.error('Error deleting class:', error);
		return res.status(500).json({ error: error.message });
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

app.get('/api/student/me/classes', authenticate, requireRole('student'), async (req, res) => {
	try {
		const items = await getClassesForUser(req.user.uid, 'student');
		return res.json({ items });
	} catch (error) {
		console.error('Error loading student classes:', error);
		return res.status(500).json({ error: 'Failed to load student classes' });
	}
});

app.get('/api/student/me/grades', authenticate, requireRole('student'), async (req, res) => {
	try {
		const gradesSnap = await db.collection('grades').where('studentUid', '==', req.user.uid).get();
		const directGrades = gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		const items = [];
		for (const g of directGrades) {
			items.push({
				id: g.id,
				subject: g.subject || 'General',
				teacher: g.teacherName || 'Teacher',
				grade: g.grade || 'B',
				percentage: Number(g.percentage ?? g.score ?? 80),
				status: g.status || 'pass'
			});
		}
		return res.json(items);
	} catch (error) {
		console.error('Error fetching student grades:', error);
		return res.status(500).json({ error: 'Failed to fetch grades' });
	}
});

app.get('/api/teacher/me', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Teacher record not found' });
		}

		const profileRecord = await getProfileRecord('teacher', req.user.uid);
		return res.json(buildUserResponse(userRecord, profileRecord));
	} catch (error) {
		console.error('Error loading teacher profile:', error);
		return res.status(500).json({ error: 'Failed to load teacher profile' });
	}
});

app.get('/api/teacher/me/classes', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const items = await getClassesForUser(req.user.uid, 'teacher');
		return res.json({ items });
	} catch (error) {
		console.error('Error loading teacher classes:', error);
		return res.status(500).json({ error: 'Failed to load teacher classes' });
	}
});

app.get('/api/teacher/me/students', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const teacherClasses = await getClassesForUser(req.user.uid, 'teacher');
		const classIds = teacherClasses.map(c => c.id);
		if (!classIds.length) {
			return res.json({ items: [] });
		}

		const studentUidsSet = new Set();
		for (const classId of classIds) {
			const classSnap = await db.collection('classes').doc(classId).get();
			if (classSnap.exists) {
				const classData = classSnap.data();
				const studentUids = Array.isArray(classData.studentUids) ? classData.studentUids : [];
				studentUids.forEach(uid => studentUidsSet.add(uid));
			}
		}

		const items = [];
		for (const studentUid of studentUidsSet) {
			const studentUser = await getUserRecord(studentUid);
			if (studentUser) {
				const studentProfile = await getProfileRecord('student', studentUid);
				items.push(buildUserResponse(studentUser, studentProfile));
			}
		}

		return res.json({ items });
	} catch (error) {
		console.error('Error listing teacher students:', error);
		return res.status(500).json({ error: 'Failed to list teacher students' });
	}
});

app.get('/api/teacher/classes/:classId/students', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const classId = req.params.classId;
		const teacherClasses = await getClassesForUser(req.user.uid, 'teacher');
		const classIds = teacherClasses.map(c => c.id);
		if (!classIds.includes(classId)) {
			return res.status(403).json({ error: 'Forbidden: You do not teach this class' });
		}

		const classSnap = await db.collection('classes').doc(classId).get();
		if (!classSnap.exists) {
			return res.status(404).json({ error: 'Class not found' });
		}

		const classData = classSnap.data();
		const studentUids = Array.isArray(classData.studentUids) ? classData.studentUids : [];
		if (!studentUids.length) {
			return res.json({ items: [] });
		}

		const items = [];
		for (const studentUid of studentUids) {
			const studentUser = await getUserRecord(studentUid);
			if (studentUser) {
				const studentProfile = await getProfileRecord('student', studentUid);
				items.push(buildUserResponse(studentUser, studentProfile));
			}
		}

		return res.json({ items });
	} catch (error) {
		console.error('Error listing class students:', error);
		return res.status(500).json({ error: 'Failed to list class students' });
	}
});

app.get('/api/teacher/grades', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const snap = await db.collection('grades').where('teacherUid', '==', req.user.uid).get();
		const items = [];
		for (const doc of snap.docs) {
			const data = doc.data();
			let studentName = '';
			let initials = '';
			const studentUser = await getUserRecord(data.studentUid);
			if (studentUser) {
				studentName = `${studentUser.firstName} ${studentUser.lastName}`.trim();
				initials = ((studentUser.firstName?.[0] || '') + (studentUser.lastName?.[0] || '')).toUpperCase();
			}
			items.push({
				id: doc.id,
				studentId: data.studentUid,
				studentName,
				initials,
				subject: data.subject,
				activityTitle: data.activityTitle,
				activityType: data.activityType,
				score: data.score,
				maxScore: data.maxScore,
				date: data.date,
				classId: data.classId
			});
		}
		return res.json({ items });
	} catch (error) {
		console.error('Error loading teacher grades:', error);
		return res.status(500).json({ error: 'Failed to load grades' });
	}
});

app.post('/api/teacher/grades', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		const payload = req.body;
		if (!payload.studentId || payload.score === undefined) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		
		const gradeRef = payload.id && !payload.id.startsWith('g') ? db.collection('grades').doc(payload.id) : db.collection('grades').doc();
		
		const pct = Math.round((Number(payload.score) / Number(payload.maxScore || 100)) * 100);
		const gradeLetter = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
		const statusVal = pct >= 90 ? 'excellent' : pct >= 60 ? 'pass' : 'fail';
		
		const teacherUser = await getUserRecord(req.user.uid);
		const teacherName = teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}`.trim() : 'Teacher';
		
		const gradeData = {
			studentUid: payload.studentId,
			subject: payload.subject || 'General',
			teacherName: teacherName,
			teacherUid: req.user.uid,
			grade: gradeLetter,
			percentage: pct,
			score: Number(payload.score),
			maxScore: Number(payload.maxScore || 100),
			status: statusVal,
			activityTitle: payload.activityTitle || 'Assignment',
			activityType: payload.activityType || 'assignment',
			date: payload.date || new Date().toISOString().split('T')[0],
			classId: payload.classId || '',
			createdAt: admin.firestore.FieldValue.serverTimestamp()
		};
		
		await gradeRef.set(gradeData, { merge: true });
		
		// Create notification for the student
		await db.collection(`users/${payload.studentId}/notifications`).add({
			userId: payload.studentId,
			title: 'New Grade Posted',
			message: `You received a new grade for ${payload.activityTitle || 'an activity'} in ${payload.subject || 'General'}.`,
			isRead: false,
			type: 'academic',
			timestamp: admin.firestore.FieldValue.serverTimestamp()
		});

		// Try to notify the parent as well
		const studentUserSnap = await db.collection('users').doc(payload.studentId).get();
		if (studentUserSnap.exists) {
			const studentData = studentUserSnap.data();
			if (studentData.parentUid) {
				await db.collection(`users/${studentData.parentUid}/notifications`).add({
					userId: studentData.parentUid,
					title: 'New Grade Posted',
					message: `A new grade was posted for ${studentData.firstName || 'your child'} in ${payload.subject || 'General'}.`,
					isRead: false,
					type: 'academic',
					timestamp: admin.firestore.FieldValue.serverTimestamp()
				});
			}
		}
		
		return res.json({ message: 'Grade saved successfully', item: { id: gradeRef.id, studentId: payload.studentId, studentName: payload.studentName, initials: payload.initials, ...gradeData } });
	} catch (error) {
		console.error('Error saving grade:', error);
		return res.status(500).json({ error: 'Failed to save grade' });
	}
});

app.delete('/api/teacher/grades/:id', authenticate, requireRole('teacher'), async (req, res) => {
	try {
		await db.collection('grades').doc(req.params.id).delete();
		return res.json({ message: 'Grade deleted successfully' });
	} catch (error) {
		console.error('Error deleting grade:', error);
		return res.status(500).json({ error: 'Failed to delete grade' });
	}
});

app.get('/api/parent/me', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Parent record not found' });
		}

		const profileRecord = await getProfileRecord('parent', req.user.uid);
		return res.json(buildUserResponse(userRecord, profileRecord));
	} catch (error) {
		console.error('Error loading parent profile:', error);
		return res.status(500).json({ error: 'Failed to load parent profile' });
	}
});

app.get('/api/parent/me/children', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Parent record not found' });
		}

		const profileRecord = await getProfileRecord('parent', req.user.uid);
		let childrenUids = Array.isArray(profileRecord?.childrenUids) ? profileRecord.childrenUids : Array.isArray(userRecord.childrenUids) ? userRecord.childrenUids : [];

		if (!childrenUids.length) {
			const studentsSnap = await db.collection('users').where('role', '==', 'student').limit(2).get();
			if (!studentsSnap.empty) {
				childrenUids = studentsSnap.docs.map(doc => doc.id);
				await db.collection('users').doc(req.user.uid).set({ childrenUids }, { merge: true });
				await db.collection('parentProfiles').doc(req.user.uid).set({ childrenUids }, { merge: true });
				for (const childId of childrenUids) {
					await db.collection('users').doc(childId).set({ parentUid: req.user.uid }, { merge: true });
					await db.collection('studentProfiles').doc(childId).set({ parentUid: req.user.uid }, { merge: true });
				}
			} else {
				const mockStudentRef = db.collection('users').doc();
				const mockStudentId = mockStudentRef.id;
				const mockStudentData = {
					email: `mock.student.${mockStudentId.slice(-4)}@eduventure.edu`,
					role: 'student',
					firstName: 'Demo',
					lastName: 'Student',
					parentUid: req.user.uid,
					createdAt: admin.firestore.FieldValue.serverTimestamp()
				};
				await mockStudentRef.set(mockStudentData);
				await db.collection('studentProfiles').doc(mockStudentId).set(mockStudentData);
				childrenUids = [mockStudentId];
				await db.collection('users').doc(req.user.uid).set({ childrenUids }, { merge: true });
				await db.collection('parentProfiles').doc(req.user.uid).set({ childrenUids }, { merge: true });
			}
		}

		const items = [];
		for (const studentUid of childrenUids) {
			const studentUser = await getUserRecord(studentUid);
			if (studentUser) {
				const studentProfile = await getProfileRecord('student', studentUid);
				items.push(buildUserResponse(studentUser, studentProfile));
			}
		}

		return res.json({ items });
	} catch (error) {
		console.error('Error loading parent children:', error);
		return res.status(500).json({ error: 'Failed to load children details' });
	}
});

async function verifyParentChildRelationship(parentUid, childUid) {
	const parentUser = await getUserRecord(parentUid);
	if (!parentUser) return false;
	const parentProfile = await getProfileRecord('parent', parentUid);
	const childrenUids = Array.isArray(parentProfile?.childrenUids)
		? parentProfile.childrenUids
		: Array.isArray(parentUser.childrenUids)
			? parentUser.childrenUids
			: [];
	return childrenUids.includes(childUid);
}

app.get('/api/parent/children/:childId/attendance', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const snap = await db.collection('attendance').where('studentUid', '==', childId).get();
		let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		if (items.length === 0) {
			const studentUser = await getUserRecord(childId);
			const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : 'Child';
			const seedData = [
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-09', status: 'present', notes: '' },
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-08', status: 'present', notes: '' },
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-07', status: 'absent', notes: 'Fever' },
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-06', status: 'present', notes: '' },
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-05', status: 'late', notes: 'Traffic delay' },
				{ studentUid: childId, childId, childName: studentName, date: '2025-06-04', status: 'present', notes: '' },
			];

			for (const rec of seedData) {
				const docRef = db.collection('attendance').doc();
				await docRef.set({
					...rec,
					createdAt: admin.firestore.FieldValue.serverTimestamp()
				});
				items.push({ id: docRef.id, ...rec });
			}
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching child attendance:', error);
		return res.status(500).json({ error: 'Failed to fetch attendance.' });
	}
});

app.get('/api/parent/children/:childId/grades', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const gradesSnap = await db.collection('grades').where('studentUid', '==', childId).get();
		let directGrades = gradesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		const submissionsSnap = await db.collection('activitySubmissions').where('studentUid', '==', childId).get();
		let submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		const items = [];

		for (const g of directGrades) {
			items.push({
				id: g.id,
				childId,
				subject: g.subject || 'General',
				teacher: g.teacherName || 'Teacher',
				grade: g.grade || 'B',
				percentage: Number(g.percentage ?? g.score ?? 80),
				status: g.status || 'pass'
			});
		}

		for (const sub of submissions) {
			const actSnap = await db.collection('activities').doc(sub.activityId).get();
			if (actSnap.exists) {
				const act = actSnap.data();
				let subject = 'Activity';
				let teacherName = 'Teacher';
				if (act.classId) {
					const classSnap = await db.collection('classes').doc(act.classId).get();
					if (classSnap.exists) {
						const classData = classSnap.data();
						subject = classData.name || 'Activity';
						if (classData.teacherUid) {
							const teacherUser = await getUserRecord(classData.teacherUid);
							if (teacherUser) {
								teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`.trim();
							}
						}
					}
				}

				const pct = Number(sub.gradePercentage ?? Math.round((sub.gradeScore / (sub.totalQuestions || 1)) * 100));
				const gradeLetter = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
				const statusVal = pct >= 90 ? 'excellent' : pct >= 60 ? 'pass' : 'fail';

				items.push({
					id: sub.id,
					childId,
					subject: `${subject} (${act.title})`,
					teacher: teacherName,
					grade: gradeLetter,
					percentage: pct,
					status: statusVal
				});
			}
		}

		if (items.length === 0) {
			const seedGrades = [
				{ subject: 'Mathematics', teacher: 'Mr. Wael', grade: 'A', percentage: 95, status: 'excellent' },
				{ subject: 'English', teacher: 'Mr. Jehad', grade: 'A-', percentage: 91, status: 'excellent' },
				{ subject: 'History', teacher: 'Mr. Bashar', grade: 'B+', percentage: 88, status: 'pass' },
				{ subject: 'Arabic', teacher: 'Mr. Naif', grade: 'A', percentage: 93, status: 'excellent' },
				{ subject: 'Science', teacher: 'Mr. Jameel', grade: 'B', percentage: 84, status: 'pass' },
			];

			for (const sg of seedGrades) {
				const docRef = db.collection('grades').doc();
				const record = {
					studentUid: childId,
					subject: sg.subject,
					teacherName: sg.teacher,
					grade: sg.grade,
					percentage: sg.percentage,
					status: sg.status,
					createdAt: admin.firestore.FieldValue.serverTimestamp()
				};
				await docRef.set(record);
				items.push({
					id: docRef.id,
					childId,
					...sg
				});
			}
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching child grades:', error);
		return res.status(500).json({ error: 'Failed to fetch grades.' });
	}
});

app.get('/api/parent/children/:childId/classes', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const snap = await db.collection('classes').where('studentUids', 'array-contains', childId).get();
		const items = [];

		for (const doc of snap.docs) {
			const classData = doc.data();
			let teacherName = 'Teacher';
			if (classData.teacherUid) {
				const teacherUser = await getUserRecord(classData.teacherUid);
				if (teacherUser) {
					teacherName = `${teacherUser.firstName} ${teacherUser.lastName}`.trim();
				}
			}

			items.push({
				id: doc.id,
				name: classData.name || 'Class',
				subject: classData.name || 'Subject',
				teacher: teacherName,
				schedule: classData.code || 'Sun - Thu, 8:00 AM',
				room: '101',
				childId
			});
		}

		if (items.length === 0) {
			const seedClasses = [
				{ name: '7-A Math', subject: 'Mathematics', teacher: 'Mr. Wael', schedule: 'Sun–Thu 8:00 AM', room: '101', childId },
				{ name: '7-A English', subject: 'English', teacher: 'Mr. Jehad', schedule: 'Sun–Thu 9:15 AM', room: '205', childId },
				{ name: '7-A Arabic', subject: 'Arabic', teacher: 'Mr. Naif', schedule: 'Sun–Thu 10:30 AM', room: '102', childId },
				{ name: '7-A Science', subject: 'Science', teacher: 'Mr. Jameel', schedule: 'Mon–Wed 11:45 AM', room: 'Lab1', childId },
			];
			return res.json(seedClasses);
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching child classes:', error);
		return res.status(500).json({ error: 'Failed to fetch classes.' });
	}
});

app.get('/api/parent/children/:childId/achievements', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const snap = await db.collection('achievements').where('studentUid', '==', childId).get();
		let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		if (items.length === 0) {
			const seedAchievements = [
				{ id: 'ach1', childId, title: 'Math Master', description: 'Score 90%+ in 5 consecutive math tests', type: 'badge', earnedDate: '2025-05-20', icon: '📐', progress: 5, maxProgress: 5 },
				{ id: 'ach2', childId, title: 'Perfect Week', description: '100% attendance for an entire week', type: 'streak', earnedDate: '2025-06-02', icon: '⭐', progress: 5, maxProgress: 5 },
				{ id: 'ach3', childId, title: 'Reading Star', description: 'Complete 20 reading assignments', type: 'challenge', earnedDate: '2025-05-15', icon: '📚', progress: 18, maxProgress: 20 },
				{ id: 'ach4', childId, title: 'Team Player', description: 'Complete 10 group projects', type: 'award', earnedDate: '2025-04-10', icon: '🤝', progress: 10, maxProgress: 10 },
			];

			for (const ach of seedAchievements) {
				const docRef = db.collection('achievements').doc();
				const record = {
					studentUid: childId,
					title: ach.title,
					description: ach.description,
					type: ach.type,
					earnedDate: ach.earnedDate,
					icon: ach.icon,
					progress: ach.progress,
					maxProgress: ach.maxProgress,
					createdAt: admin.firestore.FieldValue.serverTimestamp()
				};
				await docRef.set(record);
				items.push({ id: docRef.id, childId, ...ach });
			}
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching achievements:', error);
		return res.status(500).json({ error: 'Failed to fetch achievements.' });
	}
});

app.get('/api/parent/children/:childId/venture-points', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const snap = await db.collection('pointTransactions').where('uid', '==', childId).orderBy('createdAt', 'desc').limit(20).get();
		let items = snap.docs.map(doc => {
			const data = doc.data();
			const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
			return {
				id: doc.id,
				childId,
				date,
				activity: data.activityTitle || data.type || 'Point adjustment',
				points: data.delta || 0,
				type: (data.delta || 0) >= 0 ? 'earned' : 'spent'
			};
		});

		if (items.length === 0) {
			const seedVP = [
				{ id: 'vp1', childId, date: '2025-06-09', activity: 'Completed Math Homework', points: 50, type: 'earned' },
				{ id: 'vp2', childId, date: '2025-06-08', activity: 'Perfect Week Badge', points: 200, type: 'earned' },
				{ id: 'vp3', childId, date: '2025-06-07', activity: 'Quiz Score 100%', points: 100, type: 'earned' },
				{ id: 'vp4', childId, date: '2025-06-05', activity: 'Redeemed Mini Notebook', points: -150, type: 'spent' },
				{ id: 'vp5', childId, date: '2025-06-03', activity: 'Completed Science Lab', points: 75, type: 'earned' },
			];
			return res.json(seedVP);
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching venture points:', error);
		return res.status(500).json({ error: 'Failed to fetch venture points.' });
	}
});

app.get('/api/parent/children/:childId/rewards', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const snap = await db.collection('shopRedemptions').where('uid', '==', childId).orderBy('createdAt', 'desc').get();
		let items = snap.docs.map(doc => {
			const data = doc.data();
			const redeemedDate = data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
			return {
				id: doc.id,
				childId,
				rewardName: data.itemName || 'Reward Item',
				cost: data.cost || 0,
				redeemedDate,
				status: 'active'
			};
		});

		if (items.length === 0) {
			const seedRewards = [
				{ id: 'r1', childId, rewardName: 'Mini Notebook', cost: 150, redeemedDate: '2025-06-05', status: 'active' },
				{ id: 'r2', childId, rewardName: 'Extra Break Time', cost: 100, redeemedDate: '2025-05-20', status: 'used' },
				{ id: 'r3', childId, rewardName: 'School Badge', cost: 200, redeemedDate: '2025-05-10', status: 'used' },
			];
			return res.json(seedRewards);
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching redeemed rewards:', error);
		return res.status(500).json({ error: 'Failed to fetch rewards.' });
	}
});

app.get('/api/parent/children/:childId/learning-progress', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const childId = req.params.childId;
		const isRelated = await verifyParentChildRelationship(req.user.uid, childId);
		if (!isRelated) {
			return res.status(403).json({ error: 'Access denied: Student is not your child.' });
		}

		const classes = await getClassesForUser(childId, 'student');
		const classIds = classes.map(c => c.id);

		if (!classIds.length) {
			const seedProgress = [
				{ childId, subject: 'Mathematics', progress: 91, assignmentsCompleted: 18, assignmentsTotal: 20, quizAverage: 93, trend: [78, 82, 85, 88, 91, 93] },
				{ childId, subject: 'English', progress: 85, assignmentsCompleted: 15, assignmentsTotal: 18, quizAverage: 88, trend: [75, 79, 82, 84, 85, 88] },
				{ childId, subject: 'Arabic', progress: 88, assignmentsCompleted: 16, assignmentsTotal: 18, quizAverage: 90, trend: [80, 83, 85, 87, 88, 90] },
				{ childId, subject: 'Science', progress: 78, assignmentsCompleted: 12, assignmentsTotal: 16, quizAverage: 84, trend: [70, 73, 75, 77, 78, 84] },
			];
			return res.json(seedProgress);
		}

		const actSnap = await db.collection('activities').where('classId', 'in', classIds).get();
		const activities = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		const subSnap = await db.collection('activitySubmissions').where('studentUid', '==', childId).get();
		const submissions = subSnap.docs.map(doc => doc.data());

		const items = [];

		for (const cls of classes) {
			const classActs = activities.filter(a => a.classId === cls.id);
			const classSubs = submissions.filter(s => classActs.some(a => a.id === s.activityId));

			const completed = classSubs.length;
			const total = classActs.length || 5;
			const compCompleted = Math.min(completed, total);

			const scores = classSubs.map(s => Number(s.gradePercentage ?? Math.round((s.gradeScore / (s.totalQuestions || 1)) * 100)));
			const avgScore = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 85;

			items.push({
				childId,
				subject: cls.name || 'Subject',
				progress: avgScore,
				assignmentsCompleted: compCompleted,
				assignmentsTotal: total,
				quizAverage: avgScore,
				trend: [70, 75, 80, 82, 85, avgScore]
			});
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching learning progress:', error);
		return res.status(500).json({ error: 'Failed to fetch learning progress.' });
	}
});

app.get('/api/parent/events', authenticate, requireRole('parent'), async (req, res) => {
	try {
		const snap = await db.collection('schoolEvents').orderBy('date', 'asc').get();
		let items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		if (items.length === 0) {
			const seedEvents = [
				{ title: 'Parent-Teacher Meeting', date: '2025-06-15', type: 'meeting' },
				{ title: 'Science Fair', date: '2025-06-20', type: 'event' },
				{ title: 'End of Year Ceremony', date: '2025-06-28', type: 'ceremony' },
				{ title: 'Mid-Year Exams Begin', date: '2025-07-01', type: 'exam' },
			];

			for (const ev of seedEvents) {
				const docRef = db.collection('schoolEvents').doc();
				await docRef.set(ev);
				items.push({ id: docRef.id, ...ev });
			}
		}

		return res.json(items);
	} catch (error) {
		console.error('Error fetching events:', error);
		return res.status(500).json({ error: 'Failed to fetch school events.' });
	}
});

app.post('/api/admin/create-user', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const { email, role, classIds = [], firstName = '', lastName = '', dateOfBirth = '', childrenUids = [] } = req.body;
		const normalizedRole = normalizeRole(role);
		const allowedRoles = ['admin', 'student', 'parent', 'teacher'];

		if (!email || !normalizedRole) {
			return res.status(400).json({ error: 'email and role are required.' });
		}

		if (!allowedRoles.includes(normalizedRole)) {
			return res.status(400).json({ error: 'Invalid role.' });
		}

		const { userRecord, tempPassword } = await createUser(email, normalizedRole, { classIds, firstName, lastName, dateOfBirth, childrenUids });
		await admin.auth().setCustomUserClaims(userRecord.uid, { role: normalizedRole });

		if (normalizedRole === 'parent' && childrenUids.length) {
			for (const studentUid of childrenUids) {
				await db.collection('users').doc(studentUid).set({ parentUid: userRecord.uid }, { merge: true });
				await db.collection('studentProfiles').doc(studentUid).set({ parentUid: userRecord.uid }, { merge: true });
			}
		}

		if (normalizedRole !== 'admin' && normalizeClassIds(classIds).length) {
			await syncClassMembership(userRecord.uid, normalizedRole, [], classIds);
		}
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

app.get('/api/activities', authenticate, async (req, res) => {
	try {
		const role = normalizeRole(req.user?.role || req.user?.claims?.role);
		const snap = await db.collection('activities').orderBy('createdAt', 'desc').get();
		const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
		if (role === 'student') {
			const classes = await getClassesForUser(req.user.uid, role);
			const classIds = new Set(classes.map((item) => item.id));
			return res.json({ items: items.filter((item) => !item.classId || classIds.has(item.classId)) });
		}
		return res.json({ items });
	} catch (error) {
		console.error('Error listing activities:', error);
		return res.status(500).json({ error: 'Failed to list activities' });
	}
});

app.get('/api/activities/:activityId', authenticate, async (req, res) => {
	try {
		const role = normalizeRole(req.user?.role || req.user?.claims?.role);
		const docSnap = await db.collection('activities').doc(req.params.activityId).get();
		const activity = serializeActivity(docSnap);

		if (!activity) {
			return res.status(404).json({ error: 'Activity not found' });
		}

		if (role === 'student' && activity.classId) {
			const classes = await getClassesForUser(req.user.uid, role);
			const classIds = new Set(classes.map((item) => item.id));
			if (!classIds.has(activity.classId)) {
				return res.status(403).json({ error: 'Activity not available for this class' });
			}
		}

		return res.json(activity);
	} catch (error) {
		console.error('Error loading activity:', error);
		return res.status(500).json({ error: 'Failed to load activity' });
	}
});

app.post('/api/activities', authenticate, requireRole('admin', 'teacher'), async (req, res) => {
	try {
		const payload = sanitizeActivityPayload(req.body || {});

		if (!payload.title || !payload.description || !payload.questions.length) {
			return res.status(400).json({ error: 'title, description, and questions are required.' });
		}

		const docRef = db.collection('activities').doc();
		await docRef.set({
			...payload,
			createdByUid: req.user.uid,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return res.status(201).json({
			message: 'Activity created successfully!',
			item: { id: docRef.id, ...payload, createdByUid: req.user.uid },
		});
	} catch (error) {
		console.error('Error creating activity:', error);
		return res.status(500).json({ error: error.message || 'Failed to create activity' });
	}
});

app.put('/api/activities/:activityId', authenticate, requireRole('admin', 'teacher'), async (req, res) => {
	try {
		const docRef = db.collection('activities').doc(req.params.activityId);
		const docSnap = await docRef.get();
		if (!docSnap.exists) {
			return res.status(404).json({ error: 'Activity not found' });
		}

		const payload = sanitizeActivityPayload({ ...docSnap.data(), ...req.body });
		await docRef.set(
			{
				...payload,
				createdByUid: docSnap.data()?.createdByUid || req.user.uid,
				createdAt: docSnap.data()?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		return res.json({
			message: 'Activity updated successfully!',
			item: { id: docRef.id, ...payload, createdByUid: docSnap.data()?.createdByUid || req.user.uid },
		});
	} catch (error) {
		console.error('Error updating activity:', error);
		return res.status(500).json({ error: error.message || 'Failed to update activity' });
	}
});

app.delete('/api/activities/:activityId', authenticate, requireRole('admin', 'teacher'), async (req, res) => {
	try {
		const docRef = db.collection('activities').doc(req.params.activityId);
		const docSnap = await docRef.get();
		if (!docSnap.exists) {
			return res.status(404).json({ error: 'Activity not found' });
		}

		await docRef.delete();
		return res.json({ message: 'Activity deleted successfully!' });
	} catch (error) {
		console.error('Error deleting activity:', error);
		return res.status(500).json({ error: 'Failed to delete activity' });
	}
});

app.post('/api/activities/:activityId/submissions', authenticate, requireRole('student'), async (req, res) => {
	try {
		const activitySnap = await db.collection('activities').doc(req.params.activityId).get();
		const activity = serializeActivity(activitySnap);
		if (!activity) {
			return res.status(404).json({ error: 'Activity not found' });
		}

		const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
		const evaluation = scoreSubmission(activity, answers);
		const studentRecord = await getUserRecord(req.user.uid);
		const submissionRef = db.collection('activitySubmissions').doc();

		const submission = {
			activityId: req.params.activityId,
			studentUid: req.user.uid,
			studentName: req.body?.studentName || studentRecord?.email || null,
			answers: evaluation.gradedAnswers,
			totalCorrect: evaluation.totalCorrect,
			totalQuestions: activity.questions.length,
			gradeScore: evaluation.gradeScore,
			gradePercentage: activity.type === 'quiz' ? evaluation.gradePercentage : undefined,
			earnedPoints: evaluation.earnedPoints,
			totalPoints: activity.totalPoints,
			submittedAt: admin.firestore.FieldValue.serverTimestamp(),
			status: 'submitted',
		};

		await submissionRef.set(submission);
		const pointResult = await adjustUserPoints(req.user.uid, evaluation.earnedPoints, {
			type: 'activity-completion',
			activityId: req.params.activityId,
			activityTitle: activity.title,
			submissionId: submissionRef.id,
		});

		return res.status(201).json({
			message: 'Submission recorded successfully!',
			item: {
				id: submissionRef.id,
				...submission,
				balanceAfter: pointResult.balanceAfter,
			},
		});
	} catch (error) {
		console.error('Error recording submission:', error);
		return res.status(500).json({ error: error.message || 'Failed to record submission' });
	}
});

app.get('/api/activities/:activityId/submissions', authenticate, requireRole('admin', 'teacher'), async (req, res) => {
	try {
		let query = db.collection('activitySubmissions').where('activityId', '==', req.params.activityId);
		if (req.query.studentUid) {
			query = query.where('studentUid', '==', String(req.query.studentUid));
		}

		const snap = await query.get();
		const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
		return res.json({ items });
	} catch (error) {
		console.error('Error listing submissions:', error);
		return res.status(500).json({ error: 'Failed to list submissions' });
	}
});

app.get('/api/student/me/wallet', authenticate, requireRole('student'), async (req, res) => {
	try {
		const userRecord = await getUserRecord(req.user.uid);
		if (!userRecord) {
			return res.status(404).json({ error: 'Student record not found' });
		}

		const transactionsSnap = await db
			.collection('pointTransactions')
			.where('uid', '==', req.user.uid)
			.orderBy('createdAt', 'desc')
			.limit(20)
			.get();

		return res.json({
			uid: req.user.uid,
			pointsBalance: Number(userRecord.pointsBalance || 0),
			transactions: transactionsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
		});
	} catch (error) {
		console.error('Error loading wallet:', error);
		return res.status(500).json({ error: 'Failed to load wallet' });
	}
});

app.get('/api/shop/items', authenticate, async (req, res) => {
	try {
		let query = db.collection('shopItems');
		// const currentRole = normalizeRole(req.user?.role) || normalizeRole(await getUserRole(req.user.uid));
		// if (currentRole !== 'admin') {
		// 	query = query.where('active', '==', true);
		// }

		const snap = await query.orderBy('createdAt', 'desc').get();
		const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
		return res.json({ items });
	} catch (error) {
		console.error('Error listing shop items:', error);
		return res.status(500).json({ error: 'Failed to list shop items' });
	}
});

app.post('/api/shop/items', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const payload = sanitizeShopItemPayload(req.body || {});
		if (!payload.name || !payload.price) {
			return res.status(400).json({ error: 'name and price are required.' });
		}

		const docRef = db.collection('shopItems').doc();
		await docRef.set({
			...payload,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return res.status(201).json({
			message: 'Shop item created successfully!',
			item: { id: docRef.id, ...payload },
		});
	} catch (error) {
		console.error('Error creating shop item:', error);
		return res.status(500).json({ error: error.message || 'Failed to create shop item' });
	}
});

app.put('/api/shop/items/:itemId', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const docRef = db.collection('shopItems').doc(req.params.itemId);
		const docSnap = await docRef.get();
		if (!docSnap.exists) {
			return res.status(404).json({ error: 'Shop item not found' });
		}

		const payload = sanitizeShopItemPayload({ ...docSnap.data(), ...req.body });
		await docRef.set(
			{
				...payload,
				createdAt: docSnap.data()?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		return res.json({
			message: 'Shop item updated successfully!',
			item: { id: docRef.id, ...payload },
		});
	} catch (error) {
		console.error('Error updating shop item:', error);
		return res.status(500).json({ error: error.message || 'Failed to update shop item' });
	}
});

app.delete('/api/shop/items/:itemId', authenticate, requireRole('admin'), async (req, res) => {
	try {
		const docRef = db.collection('shopItems').doc(req.params.itemId);
		const docSnap = await docRef.get();

		if (!docSnap.exists) {
			return res.status(404).json({ error: 'Shop item not found' });
		}

		await docRef.delete();

		return res.json({ message: 'Shop item deleted successfully!' });
	} catch (error) {
		console.error('Error deleting shop item:', error);
		return res.status(500).json({ error: error.message || 'Failed to delete shop item' });
	}
});

app.post('/api/shop/redeem', authenticate, requireRole('student'), async (req, res) => {
	try {
		const itemId = String(req.body?.itemId || '').trim();
		if (!itemId) {
			return res.status(400).json({ error: 'itemId is required.' });
		}

		const quantity = Number(req.body?.quantity || 1);
		if (!Number.isInteger(quantity) || quantity < 1) {
			return res.status(400).json({ error: 'quantity must be a positive integer.' });
		}

		const itemSnap = await db.collection('shopItems').doc(itemId).get();
		const item = serializeShopItem(itemSnap);
		if (!item || !item.active) {
			return res.status(404).json({ error: 'Shop item not found' });
		}

		const cost = Number(item.price || 0) * quantity;
		const pointResult = await adjustUserPoints(req.user.uid, -cost, {
			type: 'shop-redemption',
			itemId,
			itemName: item.name,
			quantity,
		});

		const redemptionRef = db.collection('shopRedemptions').doc();
		await redemptionRef.set({
			uid: req.user.uid,
			itemId,
			itemName: item.name,
			quantity,
			cost,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		return res.status(201).json({
			message: 'Item redeemed successfully!',
			item: {
				id: redemptionRef.id,
				itemId,
				itemName: item.name,
				quantity,
				cost,
				balanceAfter: pointResult.balanceAfter,
			},
		});
	} catch (error) {
		console.error('Error redeeming shop item:', error);
		if (error.message === 'Insufficient points') {
			return res.status(400).json({ error: 'Not enough points' });
		}

		return res.status(500).json({ error: error.message || 'Failed to redeem item' });
	}
});

// 5. Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
