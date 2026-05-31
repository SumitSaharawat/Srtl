// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/auth.controllers');

router.post('/login', loginAdmin);

module.exports = router;