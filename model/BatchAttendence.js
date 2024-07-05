import mongoose from "mongoose";

export const BatchAttendenceSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    attendance:{
        type: String,
        enum: ['present' , 'absent'],
        default: 'absent'
    }
});

export default mongoose.model.BatchAttendences || mongoose.model('BatchAttendence', BatchAttendenceSchema);