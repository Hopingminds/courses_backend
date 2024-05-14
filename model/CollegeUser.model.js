import mongoose from "mongoose";

export const CollegeUserSchema = new mongoose.Schema({
    password: {
        type: String,
        required: [true, "Please provide a password"],
        unique : false,
    },
    email: {
        type: String,
        required : [true, "Please provide a unique email"],
        unique: true,
    },
    phone: {
        type: Number,
    },
    name: { type: String},
    profile: { type: String},
    college: {
        type:String, 
        required: [true, "Please provide a college name"]
    },
});

export default mongoose.model.collegeusers || mongoose.model('collegeuser', CollegeUserSchema);