import mongoose from "mongoose";

export const AccessRoutesSchema = new mongoose.Schema({
    role: {
        type: String,
        unique: true
    },
    routes: [
        { type: String }
    ]
});

export default mongoose.model.Accessroutes || mongoose.model('Accessroutes', AccessRoutesSchema);