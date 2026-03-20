const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure the decoded token has the admin role/flag
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Access denied: Admin only.' });
        }

        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
