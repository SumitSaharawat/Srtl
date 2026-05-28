require('dotenv').config()
const connectDB = require('./db/db')
const express = require('express')
const inspectionRoutes = require('./routes/inspection.routes')

connectDB();

const app = express();

app.use(express.json());

app.use('/api/inspections', inspectionRoutes)


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})