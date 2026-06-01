const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('--- MIDDLEWARE DEBUG ---');
    console.log('Incoming Authorization Header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token);
    console.log('Using JWT_SECRET:', process.env.JWT_SECRET ? "Secret Found" : "Secret MISSING");

    if (!token) {
        return res.status(403).json({ message: 'Access Denied. Token missing.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = verified; // Inject verified admin profile payload into the request object
        next(); // Pass control forward to your controller
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired session token.' });
    }
};

module.exports = verifyAdminToken;