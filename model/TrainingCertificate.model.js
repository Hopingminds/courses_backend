import mongoose from "mongoose";

export const TrainingCertificateSchema = new mongoose.Schema({
    certificateId: { type: String },
    certificatePdf: { type: String }
});

export default mongoose.model.TrainingCertificates || mongoose.model('TrainingCertificate', TrainingCertificateSchema);