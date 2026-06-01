// 1. Core Environmental Settings Always Load First
require('dotenv').config();

// 2. Dependencies Modules Imports
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/db');

// 3. Routing Blueprints Imports
const inspectionRoutes = require('./routes/inspection.routes');
const authRoutes = require('./routes/auth.routes');

// 4. Initialize Express App Instance
const app = express();

// 5. Global Middlewares Setup
app.use(cors());
app.use(express.json()); // Parses incoming JSON request payloads

// 6. Connect to MongoDB Cluster
connectDB();

// 7. Route Handlers Binding Gateway
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);

// 8. 👑 AUTOMATION GUARD: Only open a network port if NOT running tests
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// 9. Export raw app framework configuration for Supertest to hook into
module.exports = app;