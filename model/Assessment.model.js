import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
    option: { type: String, required: true }
});

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [OptionSchema],
    answer: { type: String, required: true },
    maxMarks: { type: Number, default: 5 },
    submittedAnswer: { type: String }
});

const AssessmentSchema = new mongoose.Schema({
    assessment_id: { type: Number },
    assessmentName: { type: String },
    startDate: { type: Date, default: Date.now },
    lastDate: { type: Date },
    UploadDate: { type: Date, default: Date.now },
    timelimit:{type:Number, default:60},
    isProtected: { type: Boolean, default: false },
    questions: [QuestionSchema]
});

mongoose.model('Question', QuestionSchema);

export default mongoose.models.Assessment || mongoose.model('Assessment', AssessmentSchema);
