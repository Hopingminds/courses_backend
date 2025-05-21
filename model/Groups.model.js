import mongoose from "mongoose";

export const GroupSchema = new mongoose.Schema({
    groupId: { type: String },
    isTeacherChatAvailable: {type: Boolean, default: false}
})

export default mongoose.model.Groups || mongoose.model('Group', GroupSchema);