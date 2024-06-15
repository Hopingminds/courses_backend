import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    isSubmited: { type: Boolean, default: false }
});

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
    submissions: [SubmissionSchema]
});

export default mongoose.model.Assessments || mongoose.model('Assessment', AssessmentSchema);