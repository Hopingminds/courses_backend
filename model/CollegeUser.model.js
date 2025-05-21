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
    mobile: {
        type: Number,
    },
    name: { type: String},
    profile: { type: String},
    college: {
        type:String, 
        required: [true, "Please provide a college name"]
    },
    coursesAllotted:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Courses'
        }
    ],
    coins:{
        type: Number,
        default: 0
    },
    used_coins:{
        type: Number,
        default: 0
    }
});

export default mongoose.model.collegeusers || mongoose.model('collegeuser', CollegeUserSchema);