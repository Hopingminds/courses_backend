import mongoose from "mongoose";

export const UserModuleAssessmentReportSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    moduleAssessment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Test' 
    },
    isAssessmentCompleted: { 
        type: Boolean, 
        default: false 
    },
    isSuspended: { 
        type: Boolean, 
        default: false 
    },
    ProctoringScore: {
        mic: { type: Number },
        webcam: { type: Number },
        TabSwitch: { type: Number },
        multiplePersonInFrame: { type: Number },
        PhoneinFrame: { type: Number },
        SoundCaptured: { type: Number },
    },
    generatedQustionSet: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Qna'
            },
            isSubmitted: { type: Boolean, default: false },
            submittedAnswer: { type: String }
        }
    ],
    remarks: { type: String }
}, { timestamps: true });

export default mongoose.model.UserModuleAssessmentReports || mongoose.model('UserModuleAssessmentReport', UserModuleAssessmentReportSchema);