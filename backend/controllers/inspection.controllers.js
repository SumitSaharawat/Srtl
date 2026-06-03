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

const getDashboardInspections = async (req, res) => {
    try {
        // 💡 ADDED: Destructure page and limit from req.query with sensible defaults
        const { vanNumber, name, date, inspectionType, page = 1, limit = 20 } = req.query;
        let queryCondition = {};

        // 1. Filter by exact Van Identifier match
        if (vanNumber) {
            queryCondition.vanNumber = vanNumber;
        }

        // 2. Filter by Inspection Type enum ('before' or 'after')
        if (inspectionType) {
            queryCondition.inspectionType = inspectionType;
        }

        // 3. Filter by Name (Matches first OR last name dynamically using regex case-insensitive search)
        if (name) {
            queryCondition.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } }
            ];
        }

        // 4. Filter by Date Range (Queries from 00:00:00 to 23:59:59 of the selected day)
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);

            queryCondition.inspectionDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // 💡 ADDED: Parse strings to numbers and calculate skipping offset
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skipAmount = (pageNumber - 1) * limitNumber;

        // 💡 OPTIMIZED: Fetch ONLY the matching subset of records for the active page
        const records = await inspectionModel.find(queryCondition)
            .sort({ inspectionDate: -1 })
            .skip(skipAmount)
            .limit(limitNumber);
        
        // 💡 ADDED: Efficiently fetch the total document count matching this specific query
        const totalRecords = await inspectionModel.countDocuments(queryCondition);
        
        // 💡 MODIFIED: Return pagination metadata so your UI knows how many page links to build
        return res.status(200).json({ 
            count: records.length, 
            total: totalRecords,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalRecords / limitNumber),
            records 
        });

    } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { getPreSignedUrl, submitInspection, getDashboardInspections };