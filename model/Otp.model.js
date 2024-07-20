import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    phone: {
        type: Number,
        unique: true,
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
});

export default mongoose.model.OTPs || mongoose.model('OTP', UserSchema);