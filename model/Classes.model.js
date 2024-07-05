import mongoose from "mongoose";

export const BatchClassesSchema = new mongoose.Schema({
    className: {
        type: String,
    },
    startTime:{
        type:Date,
    },
    endTime:{
        type:Date,
    },
    date:{
        type:Date,
    },
    status:{
        type: String,
        enum: ['completed' , 'scheduled'],
        default: 'scheduled'
    },
    classattendance:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BatchAttendence'
        }
    ]
});

export default mongoose.model.Classes || mongoose.model('Class', BatchClassesSchema);