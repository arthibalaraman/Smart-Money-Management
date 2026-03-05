const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'smartmoney_secret_key_2025';

console.log('--- Server Starting ---');
console.log('DATABASE_URL found:', !!process.env.DATABASE_URL);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));
app.use(bodyParser.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('--- Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

/* ─── JWT Middleware ─────────────────────────────────────────── */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

/* ─── AUTH Endpoints ─────────────────────────────────────────── */

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }
        const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
        if (existing) {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, email, password: hashed }
        });
        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('[POST /api/auth/register]', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
        const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('[POST /api/auth/login]', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

/* ─── EXPENSES (user-scoped) ─────────────────────────────────── */

app.get('/api/expenses', verifyToken, async (req, res) => {
    try {
        const expenses = await prisma.expense.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' }
        });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: 'DB error', error: err.message });
    }
});

app.post('/api/expenses', verifyToken, async (req, res) => {
    try {
        const { title, amount, category, date, type, unit } = req.body;
        if (!title || !amount || !category || !date) {
            return res.status(400).json({ message: 'title, amount, category, and date are required.' });
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) return res.status(400).json({ message: 'amount must be a valid number.' });
        const record = await prisma.expense.create({
            data: { userId: req.user.id, title, amount: parsedAmount, category, date, type: type || 'EXPENSE', unit: unit || '₹' }
        });
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ message: 'DB error', error: err.message });
    }
});

app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
    try {
        await prisma.expense.deleteMany({ where: { id: parseInt(req.params.id), userId: req.user.id } });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'DB error', error: err.message });
    }
});

/* ─── FORMS (user-scoped) ────────────────────────────────────── */

app.get('/api/forms', verifyToken, async (req, res) => {
    try {
        const forms = await prisma.form.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(forms);
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.post('/api/forms', verifyToken, async (req, res) => {
    try {
        const { name, fields } = req.body;
        const form = await prisma.form.create({
            data: { userId: req.user.id, name, fields: JSON.stringify(fields) }
        });
        res.status(201).json(form);
    } catch (err) {
        console.error('[POST /api/forms]', err);
        res.status(500).json({ message: 'DB error', error: err.message });
    }
});

app.put('/api/forms/:id', verifyToken, async (req, res) => {
    try {
        const { name, fields } = req.body;
        const form = await prisma.form.update({
            where: { id: parseInt(req.params.id), userId: req.user.id },
            data: { name, fields: JSON.stringify(fields) }
        });
        res.json(form);
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.delete('/api/forms/:id', verifyToken, async (req, res) => {
    try {
        await prisma.form.delete({ where: { id: parseInt(req.params.id), userId: req.user.id } });
        res.json({ message: 'Form deleted' });
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

/* ─── FORM ENTRIES ───────────────────────────────────────────── */

app.get('/api/forms/:formId/entries', verifyToken, async (req, res) => {
    try {
        const entries = await prisma.formEntry.findMany({
            where: {
                formId: parseInt(req.params.formId),
                form: { userId: req.user.id }   // extra safety: only entries belonging to user's forms
            },
            orderBy: { date: 'desc' }
        });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.post('/api/forms/:formId/entries', verifyToken, async (req, res) => {
    try {
        const { data, date } = req.body;
        const entry = await prisma.formEntry.create({
            data: { formId: parseInt(req.params.formId), data: JSON.stringify(data), date }
        });
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.put('/api/entries/:id', verifyToken, async (req, res) => {
    try {
        const { data, date } = req.body;
        const entry = await prisma.formEntry.update({
            where: { id: parseInt(req.params.id) },
            data: { data: JSON.stringify(data), date }
        });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

app.delete('/api/entries/:id', verifyToken, async (req, res) => {
    try {
        await prisma.formEntry.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Entry deleted' });
    } catch (err) {
        res.status(500).json({ message: 'DB error' });
    }
});

/* ─── ALL ENTRIES (dashboard, user-scoped) ───────────────────── */

app.get('/api/all-entries', verifyToken, async (req, res) => {
    try {
        const entries = await prisma.formEntry.findMany({
            where: { form: { userId: req.user.id } },
            include: { form: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 100
        });
        res.json(entries);
    } catch (err) {
        console.error('[GET /api/all-entries]', err);
        res.status(500).json({ message: 'DB error' });
    }
});

/* ─── Server Listen ──────────────────────────────────────────── */

const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIp = 'localhost';
for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) { localIp = net.address; break; }
    }
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Local network access: http://${localIp}:${PORT}`);
    console.log(`📱 Use this URL in your Android App: http://${localIp}:${PORT}\n`);
});

app.use((err, req, res, next) => {
    console.error('FATAL ERROR:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
