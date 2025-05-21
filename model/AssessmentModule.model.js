import mongoose from 'mongoose';

const AssessmentModuleSchema = new mongoose.Schema({
    module_id: { type: Number },
    moduleName: { type: String },
    timelimit: { type: Number, default: 60 },
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Qna',
        }
    ]
}, { timestamps: true });

export default mongoose.models.AssessmentModules || mongoose.model('AssessmentModule', AssessmentModuleSchema);
