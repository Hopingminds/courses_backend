import mongoose from "mongoose";

export const CoursesForDegreeSchema = new mongoose.Schema({
    degrees: [
        {
            type: String,
        }
    ],
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courses'
    },
    seats:{
        type: Number,
    },
    packages:{
        from:{type: Number},
        to:{type: Number},
    }
});

export default mongoose.model.CoursesForDegrees || mongoose.model('CoursesForDegree', CoursesForDegreeSchema);