const inspectionModel = require('../models/inspection.models');
const { nanoid } = require('nanoid'); // Note: nanoid v3/v4 uses named imports depending on version
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
});

const phototypes = ['image/jpeg', 'image/jpg', 'image/png'];

const getPreSignedUrl = async (req, res) => {
    try {
        const { vanNumber, contentType, inspectionType } = req.body;

        if (!vanNumber || !contentType || !inspectionType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!phototypes.includes(contentType)) {
            return res.status(400).json({ message: 'Invalid content type' });
        }

        // FIXED: Added missing executing parentheses ()
        const dateStamp = new Date().toISOString().split('T')[0];
        const fileExtension = contentType.split('/')[1];
        
        // Handle nanoid execution safely
        const uniqueId = typeof nanoid === 'function' ? nanoid() : Math.random().toString(36).substring(2, 8);
        const s3Key = `vans/${vanNumber}/${dateStamp}/${inspectionType}-${uniqueId}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return res.status(200).json({ uploadUrl, s3Key });

    } catch (err) {
        // FIXED: Changed 'error' to 'err' so it prints to terminal properly
        console.error("DETAILED AWS ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
}

const submitInspection = async (req, res) => {
    try {
        const { vanNumber, firstName, lastName, inspectionType, s3Key } = req.body;

        if (!vanNumber || !firstName || !lastName || !inspectionType || !s3Key) {
            return res.status(400).json({ error: 'All validation fields are required.' });
        }

        // FIXED: Target 'inspectionModel' matching your import statement
        const newInspection = new inspectionModel({
            vanNumber,
            firstName,
            lastName,
            inspectionType,
            s3Key
        });

        await newInspection.save();
        return res.status(201).json({ success: true, message: 'Inspection logged successfully!' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports = { getPreSignedUrl, submitInspection };