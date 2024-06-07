import mongoose from "mongoose";

export const AssessmentSchema = new mongoose.Schema({
    assessment_id: {
        type: Number
    },
    question: {
        type: String
    },
    options:{
        type: Object,
    },
    answer: {
        type: String
    },
    maxMarks: {
        type: Number,
        default: 5
    }
});

export default mongoose.model.Assessments || mongoose.model('Assessment', AssessmentSchema);