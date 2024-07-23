import mongoose from "mongoose";

export const RegisterUserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: Number,
        unique: true,
    },
    name: { type: String},
    college: {type:String},
    degree: {type:String},
    stream: {type:String},
    course:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courses'
    },
});

export default mongoose.model.RegisterUsers || mongoose.model('RegisterUser', RegisterUserSchema);