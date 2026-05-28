const mongoose = require('mongoose');


const connectDB = async () => {
    try{
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`)
        console.log('Connected to DB', connection.connection.host)
    }catch(err){
        console.log('Error Connection to DB:', err)
    }
}

module.exports = connectDB;