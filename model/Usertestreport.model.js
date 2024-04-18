import mongoose from "mongoose";

export const UsertestreportSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Tests' },
    isTestCompleted: { type: Boolean, default: false },
    generatedQustionSet: { type: Object },
    QnaData: [
        {
            question: { type: mongoose.Schema.Types.ObjectId, ref: 'Qnas' },
            answer: { type: String }
        }
    ],
});

export default mongoose.model.Usertestreports || mongoose.model('Usertestreport', UsertestreportSchema);