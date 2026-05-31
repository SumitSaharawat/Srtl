require('dotenv').config()
const connectDB = require('./db/db')
const express = require('express')
const inspectionRoutes = require('./routes/inspection.routes')
const authRoutes = require('./routes/auth.routes')
const cors = require('cors')

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes)

connectDB();


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})