const express = require('express');
const router = express.Router();

const {getPreSignedUrl, submitInspection} = require('../controllers/inspection.controllers');

router.post('/get-presigned-url', getPreSignedUrl);
router.post('/submit-inspection', submitInspection);

module.exports = router;
