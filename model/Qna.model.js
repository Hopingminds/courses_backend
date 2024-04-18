import mongoose from "mongoose";

export const QnaSchema = new mongoose.Schema({
    question: {
        type: String
    },
    options:{
        1: {type: String},    
        2: {type: String},
        3: {type: String},
        4: {type: String},
    },
    answer: {
        type: Number
    }
});

export default mongoose.model.Qna || mongoose.model('Qna', QnaSchema);