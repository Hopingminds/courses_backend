import mongoose from 'mongoose';

const AssessmentExpirySchema = new mongoose.Schema({
    assessmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId : { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

export default mongoose.model('AssessmentExpiry', AssessmentExpirySchema);
