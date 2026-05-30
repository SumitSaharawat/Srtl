const express = require('express');
const router = express.Router();

const {getPreSignedUrl, submitInspection, getDashboardInspections} = require('../controllers/inspection.controllers');

router.post('/get-presigned-url', getPreSignedUrl);
router.post('/submit-inspection', submitInspection);
router.get('/dashboard', getDashboardInspections);

module.exports = router;
