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

			let profileRecord = null;
			if (role === 'admin' || role === 'student' || role === 'teacher' || role === 'parent') {
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
		const childrenUids = Array.isArray(profileRecord?.childrenUids) ? profileRecord.childrenUids : Array.isArray(userRecord.childrenUids) ? userRecord.childrenUids : [];

		if (!childrenUids.length) {
			return res.json({ items: [] });
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
