import mongoose from "mongoose";

export const AssessmentSchema = new mongoose.Schema({
    assessment_id: {
        type: Number
    },
    assessmentName: {
        type: String
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    lastDate: {
        type: Date
    },
    UploadDate: {
        type: Date,
        default: Date.now
    },
    timelimit:{type: Date},
    isProtected:{type: Boolean, default: false},
    questions: [{
        question: { type: String, required: true },
        options: [{
            option: { type: String, required: true }
        }],
        answer: { type: String, required: true },
        maxMarks: { type: Number, default: 5 }
    }],
    isSubmited: { type: Boolean, default: false }
});

export default mongoose.model.Assessments || mongoose.model('Assessment', AssessmentSchema);