import mongoose from "mongoose";

export const QnaSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options:{
        type: Object,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    maxMarks: {
        type: Number,
        default: 5
    }
});

export default mongoose.model.Qnas || mongoose.model('Qna', QnaSchema);