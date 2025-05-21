import mongoose from "mongoose";

export const SavedResumeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email:{
        type: Object,
        required: true,
    },
    resume: {
        type: String,
        required: true,
    }
});

export default mongoose.model.SavedResumes || mongoose.model('SavedResume', SavedResumeSchema);