import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
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
    }
});

export default mongoose.model('Result', ResultSchema);
