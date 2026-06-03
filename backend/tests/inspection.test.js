// tests/inspection.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Path to your main Express entry file
const inspectionModel = require('../models/inspection.models');
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Mock AWS SDK entirely so tests run entirely local and blazingly fast
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('📋 Fleet Inspection Automation Suite', () => {

    beforeAll(async () => {
        // Wait briefly for the connection pool to become fully active if needed
        if (mongoose.connection.readyState !== 1) {
            // Fallback check to ensure Jest doesn't proceed without a connection state
            await new Promise((resolve) => mongoose.connection.once('open', resolve));
        }
    });

    afterAll(async () => {
        // Purge test generation records clean to keep MongoDB empty and pristine
        await inspectionModel.deleteMany({ firstName: { $regex: 'Test-Automation', $options: 'i' } });
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear any old structural test states before every evaluation block runs
        await inspectionModel.deleteMany({ firstName: { $regex: 'Test-Automation', $options: 'i' } });
    });

    // =========================================================================
    // 🟢 UNIT TESTING ZONE: AWS S3 SECURE PRESIGNER HANDSHAKE
    // =========================================================================
    describe('🔬 Unit Tests: /api/inspections/get-presigned-url', () => {

        it('should REJECT request with 400 if vital validation fields are missing', async () => {
            const res = await request(app)
                .post('/api/inspections/get-presigned-url')
                .send({
                    vanNumber: 'Van-99'
                    // contentType and inspectionType are intentionally omitted
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Missing required fields');
        });

        it('should REJECT request with 400 if contentType is not a whitelisted photograph type', async () => {
            const res = await request(app)
                .post('/api/inspections/get-presigned-url')
                .send({
                    vanNumber: 'Van-99',
                    contentType: 'application/pdf', // ❌ Banned file extension
                    inspectionType: 'before'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid content type');
        });

        it('should ALLOW access and return 200 with generated AWS payload structural metadata keys', async () => {
            getSignedUrl.mockResolvedValue('https://mock-s3-presigned-url.com/upload/token');

            const res = await request(app)
                .post('/api/inspections/get-presigned-url')
                .send({
                    vanNumber: 'Van-99',
                    contentType: 'image/jpeg', // ✅ Whitelisted
                    inspectionType: 'before'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('uploadUrl', 'https://mock-s3-presigned-url.com/upload/token');
            expect(res.body).toHaveProperty('s3Key');
            expect(res.body.s3Key).toContain('vans/Van-99/');
            expect(res.body.s3Key).toContain('before-');
        });
    });

    // =========================================================================
    // 🟡 INTEGRATION TESTING ZONE: MONGODB WORKFLOW & PAGINATION LAYERS
    // =========================================================================
    describe('🗄️ Integration Tests: Data-Flow Persistence & Pagination Lifecycle', () => {

        it('should REJECT submission with 400 if required schema parameters are missing', async () => {
            const res = await request(app)
                .post('/api/inspections/submit-inspection')
                .send({
                    vanNumber: 'Van-99',
                    firstName: 'Test-Automation-User'
                    // missing lastName, inspectionType, and s3Key array
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'All validation fields are required.');
        });

        it('should write data to MongoDB, handle string array validation arrays, and query back filtering by vanNumber', async () => {
            const uniqueTestKey = `vans/Van-99/2026-test/before-${Math.random().toString(36).substring(7)}.jpeg`;

            const submitRes = await request(app)
                .post('/api/inspections/submit-inspection')
                .send({
                    vanNumber: 'Van-99',
                    firstName: 'Test-Automation-User',
                    lastName: 'Integration-Validation',
                    inspectionType: 'before',
                    s3Key: [uniqueTestKey] // Passed inside an array to align with schema targets
                });

            expect(submitRes.statusCode).toEqual(201);
            expect(submitRes.body).toHaveProperty('success', true);

            // Fetch logs from the dashboard
            const dashboardRes = await request(app)
                .get('/api/inspections/dashboard')
                .query({ vanNumber: 'Van-99' });

            expect(dashboardRes.statusCode).toEqual(200);
            expect(dashboardRes.body).toHaveProperty('records');
            expect(dashboardRes.body.currentPage).toEqual(1);

            // Handle checking matching properties within an array safely via a conditional loop check
            const verifiedRecord = dashboardRes.body.records.find(r => 
                Array.isArray(r.s3Key) ? r.s3Key.includes(uniqueTestKey) : r.s3Key === uniqueTestKey
            );

            expect(verifiedRecord).toBeDefined();
            expect(verifiedRecord.firstName).toEqual('Test-Automation-User');
        });

        it('should safely execute case-insensitive regular expression lookups matching name variations', async () => {
            await inspectionModel.create({
                vanNumber: 'Van-01',
                firstName: 'Test-Automation-Sumit',
                lastName: 'Saharawat',
                inspectionType: 'after',
                s3Key: ['keys/1.jpg']
            });

            // Match query string using lowercase text strings
            const lowercaseRes = await request(app)
                .get('/api/inspections/dashboard')
                .query({ name: 'sumit' });

            expect(lowercaseRes.statusCode).toEqual(200);
            expect(lowercaseRes.body.count).toBeGreaterThanOrEqual(1);
            expect(lowercaseRes.body.records[0].lastName).toEqual('Saharawat');
        });

        it('should enforce strict calculation bounds partitioning page results accurately', async () => {
            // 💡 FIX: Use a completely unique name constraint so no leaking documents can ever match
            const uniqueFirstName = 'Test-Automation-Unique-Pagination';

            // Generate 25 discrete documents programmatically
            const seedRecords = Array.from({ length: 25 }).map((_, index) => ({
                vanNumber: 'Van-04',
                firstName: uniqueFirstName, // Applied here
                lastName: `Driver-${index}`,
                inspectionType: 'before',
                s3Key: [`vans/Van-04/key-${index}.jpeg`],
                inspectionDate: new Date(Date.now() - index * 60000) 
            }));

            await inspectionModel.insertMany(seedRecords);

            // Evaluate data properties on Page 1
            const pageOneRes = await request(app)
                .get('/api/inspections/dashboard')
                // 💡 FIX: Query explicitly using the unique name field constraint
                .query({ vanNumber: 'Van-04', name: uniqueFirstName, page: 1, limit: 20 });

            expect(pageOneRes.statusCode).toEqual(200);
            expect(pageOneRes.body.count).toEqual(20); // First block contains exactly 20 elements
            expect(pageOneRes.body.total).toEqual(25);  // Matches the exact 25 documents we seeded!
            expect(pageOneRes.body.totalPages).toEqual(2); 

            // Evaluate data properties on Page 2
            const pageTwoRes = await request(app)
                .get('/api/inspections/dashboard')
                // 💡 FIX: Query explicitly using the unique name field constraint here too
                .query({ vanNumber: 'Van-04', name: uniqueFirstName, page: 2, limit: 20 });

            expect(pageTwoRes.statusCode).toEqual(200);
            expect(pageTwoRes.body.count).toEqual(5);  // Remainder items shift neatly down
            expect(pageTwoRes.body.currentPage).toEqual(2);
        });
    });
});