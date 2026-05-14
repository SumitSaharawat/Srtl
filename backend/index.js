// server.js
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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

//API to give ipload Url to send Pictures to S3 Bucket
app.get('/get-upload-url', async (req, res) => {
    const { vehicleId, driverName, fileType } = req.query;
    
    // Get current date in YYYY-MM-DD format using the server's local timezone
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const timestamp = Date.now();
    
    // Construct the structured Key
    const key = `uploads/${vehicleId}/${driverName}/${date}/${timestamp}.jpg`;

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

//
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


//Function to get all images in S3 for specific vehicle, Driver and Date
app.get('/list-images', async (req, res) => {
    const { vehicleId, driverName, date } = req.query;
    
    if (!vehicleId || !driverName || !date) {
        return res.status(400).send("Missing parameters");
    }
    
    // Search for images using the specific folder structure prefix
    const prefix = `uploads/${vehicleId}/${driverName}/${date}/`;
    
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: prefix,
        });
        
        const data = await s3Client.send(listCommand);
        
        if (!data.Contents || data.Contents.length === 0) {
            return res.json({ urls: [] });
        }

        // Generate a pre-signed download URL for each matched file
        const urls = await Promise.all(data.Contents.map(async (item) => {
            const getCmd = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: item.Key,
            });
            return await getSignedUrl(s3Client, getCmd, { expiresIn: 300 });
        }));

        res.json({ urls });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});