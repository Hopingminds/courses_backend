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
    }
});

export default mongoose.model.Qnas || mongoose.model('Qna', QnaSchema);