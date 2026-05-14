// server.js
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

app.get('/get-upload-url', async (req, res) => {
    const { vehicleId, fileType } = req.query; // e.g. JAG-123, image/jpeg
    
    if (!vehicleId || !fileType) {
        return res.status(400).send("Missing vehicleId or fileType");
    }

    // Get extension from fileType (e.g., image/png -> png)
    const ext = fileType.split('/')[1] || 'jpg';
    
    // Key defines the "folder structure" in S3
    const key = `uploads/${encodeURIComponent(vehicleId)}/${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        res.json({ url, key });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/get-download-url', async (req, res) => {
    const { key } = req.query;
    if (!key) {
        return res.status(400).send("Missing key parameter");
    }
    
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        });
    
        try {
            const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            res.json({ url });
        } catch (err) {
            res.status(500).send(err.message);
        }
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});