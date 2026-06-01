// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/auth.controllers');
const verifyAdminToken = require('../middlewares/auth.middlewares');
const { getDashboardInspections } = require('../controllers/inspection.controllers');



router.get('/dashboard', verifyAdminToken, getDashboardInspections);

router.post('/login', loginAdmin);

module.exports = router;