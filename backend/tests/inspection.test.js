// tests/inspection.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Path to your main Express app
const inspectionModel = require('../models/inspection.models');
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Mock AWS SDK entirely so tests don't make real network calls to Amazon S3
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('📋 Fleet Inspection Automation Suite', () => {

    // // Setup and breakdown database lifecycle hooks for Integration tests
    // beforeAll(async () => {
    //     if (mongoose.connection.readyState !== 1) {
    //         await mongoose.connect(process.env.MONGODB_URL);
    //     }
    // });

    afterAll(async () => {
        // Clean up test artifacts and close connection cleanly
        await inspectionModel.deleteMany({ firstName: 'Test-Automation-User' });
        await mongoose.connection.close();
    });

    // =========================================================================
    // 🟢 UNIT TESTING ZONE (Isolated Logic & Route Guard Validation)
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
                    contentType: 'application/pdf', // ❌ Banned file extension type
                    inspectionType: 'before'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid content type');
        });

        it('should ALLOW access and return 200 with generated AWS payload structural metadata keys', async () => {
            // Mock AWS S3 presigner signature factory output cleanly
            getSignedUrl.mockResolvedValue('https://mock-s3-presigned-url.com/upload/token');

            const res = await request(app)
                .post('/api/inspections/get-presigned-url')
                .send({
                    vanNumber: 'Van-99',
                    contentType: 'image/jpeg', // ✅ Whitelisted
                    inspectionType: 'before'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('uploadUrl');
            expect(res.body).toHaveProperty('s3Key');
            // Assert string contains path components accurately
            expect(res.body.s3Key).toContain('vans/Van-99/');
            expect(res.body.s3Key).toContain('before-');
        });
    });

    // =========================================================================
    // 🟡 INTEGRATION TESTING ZONE (State Machine & Database Layer)
    // =========================================================================
    describe('🗄️ Integration Tests: Data-Flow Persistence Lifecycle', () => {

        it('should REJECT submission with 400 if required payload properties are missing', async () => {
            const res = await request(app)
                .post('/api/inspections/submit-inspection')
                .send({
                    vanNumber: 'Van-99',
                    firstName: 'Test-Automation-User'
                    // missing lastName, inspectionType, s3Key
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'All validation fields are required.');
        });

        it('should write data to MongoDB, create a record, and read it back on the dashboard query', async () => {
    const uniqueTestKey = `vans/Van-99/2026-test/before-${Math.random().toString(36).substring(7)}.jpeg`;

    // 1. Submit record directly to MongoDB through route API endpoint pipeline controller
    const submitRes = await request(app)
            .post('/api/inspections/submit-inspection')
            .send({
                vanNumber: 'Van-99',
                firstName: 'Test-Automation-User',
                lastName: 'Integration-Validation',
                inspectionType: 'before',
                s3Key: uniqueTestKey
            });

        expect(submitRes.statusCode).toEqual(201);
        expect(submitRes.body).toHaveProperty('success', true);

        // 2. Query Dashboard route looking ONLY for the vanNumber to guarantee filter safety
        const dashboardRes = await request(app)
            .get('/api/inspections/dashboard')
            .query({ vanNumber: 'Van-99' }); // Dropped the name filter parameter string

        // 🧪 DEBUG LOG: Let's see exactly what your database found
        console.log("--- DASHBOARD INTEGRATION DATA RESPONSE ---", JSON.stringify(dashboardRes.body, null, 2));

        expect(dashboardRes.statusCode).toEqual(200);
        expect(dashboardRes.body).toHaveProperty('records');
        
        // Verify our exact unique tracking document was stored and read back cleanly
        const verifiedRecord = dashboardRes.body.records.find(r => 
        Array.isArray(r.s3Key) ? r.s3Key.includes(uniqueTestKey) : r.s3Key === uniqueTestKey
        );

        expect(verifiedRecord).toBeDefined();
        expect(verifiedRecord.lastName).toEqual('Integration-Validation');
        });
    });
});