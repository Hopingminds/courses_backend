import mongoose from 'mongoose';

const ProctoringOptionSchema = new mongoose.Schema({
    inUse: { type: Boolean, default: false },
    maxRating: { type: Number, default: 1500 },
});

const ModuleAssessmentSchema = new mongoose.Schema({
    assessment_id: { type: Number },
    assessmentName: { type: String },
    assessmentDesc: {type: String },
    maxMarks: { type: Number },
    startDate: { type: Date, default: Date.now },
    lastDate: { type: Date },
    timelimit: { type: Number, default: 60 },
    isProtected: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    ProctoringFor: {
        mic: ProctoringOptionSchema,
        webcam: ProctoringOptionSchema,
        TabSwitch: ProctoringOptionSchema,
        multiplePersonInFrame: ProctoringOptionSchema,
        PhoneinFrame: ProctoringOptionSchema,
        SoundCaptured: ProctoringOptionSchema,
    },
    Assessmentmodules: [
        {
            module: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "AssessmentModule",
            }
        }
    ],
}, { timestamps: true });

export default mongoose.models.ModuleAssessments || mongoose.model('ModuleAssessment', ModuleAssessmentSchema);
