import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
    option: { type: String, required: true }
});

const SubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedAnswer: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
    }
});

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [OptionSchema],
    answer: { type: String, required: true },
    maxMarks: { type: Number, default: 5 },
    submittedAnswer: { type: String },
    submissions: [SubmissionSchema] 
});

export const AssessmentSchema = new mongoose.Schema({
    assessment_id: { type: Number },
    assessmentName: { type: String },
    startDate: { type: Date, default: Date.now },
    lastDate: { type: Date },
    UploadDate: { type: Date, default: Date.now },
    timelimit: { type: Date },
    isProtected: { type: Boolean, default: false },
    questions: [QuestionSchema],
    isSubmited: { type: Boolean, default: false }
});

export default mongoose.model.Assessments || mongoose.model('Assessment', AssessmentSchema);
