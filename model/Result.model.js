import mongoose from 'mongoose';

const QuestionResultSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    submittedAnswer: {
        type: String,
        // required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
    },
    maxMarks: {
        type: Number,
        required: true,
    },
    obtainedMarks: {
        type: Number,
        required: true,
    }
});

const ResultSchema = new mongoose.Schema({
    assessment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    questions: [QuestionResultSchema],
    score: {
        type: Number,
        required: true,
    },
    totalMarks: {
        type: Number,
        required: true,
    },
    submissionDate: {
        type: Date,
        default: Date.now,
    },
    isSubmitted: {
        type: Boolean,
        default: false,
    }
});

export default mongoose.model('Result', ResultSchema);
