import mongoose from "mongoose";

export const EducationSchema = new mongoose.Schema({
    collegeuser:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'collegeuser'
    },
    degree: {
        type: String,
        required: true
    },
    semester:[{
        type: Number,
    }],
    stream: [{
        type: String,
        required: true
    }]
}, { timestamps: true });

export default mongoose.model.Educations || mongoose.model('Education', EducationSchema);