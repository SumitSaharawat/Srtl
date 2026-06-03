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
        default: Date.now,
        index: true
    }
});

inspectionsSchema.index({ vanNumber: 1, inspectionDate: -1 });

module.exports = mongoose.model('Inspection', inspectionsSchema);