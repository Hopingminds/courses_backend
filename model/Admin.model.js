import mongoose from "mongoose";

export const AdminSchema = new mongoose.Schema({
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
    firstName: { type: String},
    lastName: { type: String},
    mobile : { type : Number},
    profile: { type: String}
});

export default mongoose.model.Admins || mongoose.model('Admin',AdminSchema);