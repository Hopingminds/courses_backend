import mongoose from "mongoose";

export const AccDeleteReqSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
    requestCancelled: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model.AccDeleteReqs || mongoose.model('AccDeleteReq', AccDeleteReqSchema);