import mongoose from "mongoose";

export const BatchSchema = new mongoose.Schema({
    batchId: {
        type: String,
        unique: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courses'
    },
    batchName:{
        type: String,
    },
    startDate:{
        type:Date,
    },
    endDate:{
        type:Date,
    },
    batchDuration:{
        type:Number
    },
    users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    classes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }]
});

export default mongoose.model.Batchs || mongoose.model('Batch', BatchSchema);