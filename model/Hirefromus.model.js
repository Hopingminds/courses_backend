import mongoose from "mongoose";

export const HirefromusSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    phone: { type: Number },
    company: { type: String },
    password: {type: String, default: "$2a$10$ind/oo9YPP.NFd.0tqEmFu8gFJuSW6pbQcSzMWBr8UZ3S.pRht2S."},
    isVerified: {type: Boolean, default: false}
})

export default mongoose.model.Hirefromus || mongoose.model('Hirefromus', HirefromusSchema);