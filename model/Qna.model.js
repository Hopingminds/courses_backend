import mongoose from "mongoose";

export const QnaSchema = new mongoose.Schema({
    question: {
        type: String
    },
    options:{
        type: Array,
    },
    answer: {
        type: String
    },
    maxMarks: {
        type: Number,
        default: 5
    }
});

export default mongoose.model.Qnas || mongoose.model('Qna', QnaSchema);