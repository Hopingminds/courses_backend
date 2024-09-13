import mongoose from "mongoose";

export const EnquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please provide a unique email"],
    },
    number: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
});

export default mongoose.model.Enquirys || mongoose.model('Enquiry', EnquirySchema);