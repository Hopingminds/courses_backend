import mongoose from "mongoose";

export const UsertestreportSchema = new mongoose.Schema({
    _id:{
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses'},
    assessment_id: {type: Number},
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessments' },
    submittedAnswer: { type: String }

}, {_id: false});

export default mongoose.model.Usertestreports || mongoose.model('Usertestreport', UsertestreportSchema);