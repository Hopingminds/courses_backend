import mongoose from "mongoose";

export const UsertestreportSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    isTestCompleted: { type: Boolean, default: false },
    generatedQustionSet: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Qna' }
    ],
    QnaData: [
        {
            question: { type: mongoose.Schema.Types.ObjectId, ref: 'Qna' },
            answer: { type: String }
        }
    ],
});

export default mongoose.model.Usertestreports || mongoose.model('Usertestreport', UsertestreportSchema);