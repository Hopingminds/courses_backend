import mongoose from "mongoose";

export const UsertestreportSchema = new mongoose.Schema({
    _id:{
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    isModuleCompleted: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    generatedQustionSet: [
        {
            question: { type: mongoose.Schema.Types.ObjectId, ref: 'Qna' },
            isSubmitted: { type: Boolean, default: false },
            submittedAnswer: { type: String }
        }
    ],
    remarks: { type: String }
}, {_id: false, timestamps: true});

export default mongoose.model.Usertestreports || mongoose.model('Usertestreport', UsertestreportSchema);