import mongoose from "mongoose";

export const HirefromusSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    phone: { type: Number },
    company: { type: String },
    password: {type: String}
})

export default mongoose.model.Hirefromus || mongoose.model('Hirefromus', HirefromusSchema);