const mongoose = require('mongoose');

const inspectionsSchema = new mongoose.Schema({
    vanNumber:{
        type: String,
        required: true
    },
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    inspectionType:{
        type: String,
        enum:['before', 'after'],
        required: true
    },
    s3Key:{
        type: [String],
        required: true
    },
    inspectionDate:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inspection', inspectionsSchema);