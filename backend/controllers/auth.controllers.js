// controllers/auth.controllers.js
const Admin = require('../models/admin.models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Look for the requested user profile in MongoDB
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid Admin Credentials. Access Denied.' });
        }

        // 2. Compare incoming plain text password against the hashed database string
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid Admin Credentials. Access Denied.' });
        }

        // 3. Authorization Success: Generate a cryptographically signed JWT session token
        // Token expires in 12 hours, forcing a security re-login after a standard shift period
        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.status(200).json({
            message: 'Authentication successful.',
            token,
            username: admin.username
        });

    } catch (err) {
        console.error("Auth Loop Error:", err);
        return res.status(500).json({ message: 'Internal server error occurred.' });
    }
};

module.exports = { loginAdmin };