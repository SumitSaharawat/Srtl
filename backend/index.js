require('dotenv').config()
const connectDB = require('./db/db')
const express = require('express')

connectDB();

const app = express();


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})