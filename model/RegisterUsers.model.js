import mongoose from "mongoose";

export const RegisterUserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: Number,
    },
    name: { type: String},
    college: {type:String},
    degree: {type:String},
    stream: {type:String},
    yearOfPassing: {type: Number},
    chosenCategory: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CoursesByCategorie'
    },
}, { timestamps: true });

export default mongoose.model.RegisterUsers || mongoose.model('RegisterUser', RegisterUserSchema);