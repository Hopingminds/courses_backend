import mongoose from "mongoose";

export const CareerSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    phone: { type: Number },
    degree: { type:  String }
})

export default mongoose.model.Careers || mongoose.model('Career', CareerSchema);