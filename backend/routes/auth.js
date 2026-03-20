const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login - Admin login (against .env)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUser && password === adminPass) {
        // Create payload
        const payload = {
            username: adminUser,
            isAdmin: true
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' }, // Longer expiry for convenience
            (err, token) => {
                if (err) throw err;
                res.json({ token, username: adminUser, isAdmin: true });
            }
        );
    } else {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
});

// GET /api/auth/me - Verify current admin
router.get('/me', (req, res) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.isAdmin) {
            res.json({ username: decoded.username, isAdmin: true });
        } else {
            res.status(403).json({ error: 'Not admin' });
        }
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
