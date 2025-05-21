import mongoose from "mongoose";

export const BatchSchema = new mongoose.Schema({
    batchId: {
        type: String,
        unique: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courses',
        required: true,
    },
    batchName:{
        type: String,
        required: true,
    },
    startDate:{
        type:Date,
        required: true,
    },
    endDate:{
        type:Date,
        required: true,
        validate: {
            validator: function(value) {
                return this.startDate < value;  // Ensuring endDate is after startDate
            },
            message: "End date must be after start date"
        }
    },
    batchlimit:{
        type: Number,
        default: 999999,
        required: true,
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    curriculum: [
        {
            chapter_name: { type: String },
            lessons: [
                {
                    lesson_name: { type: String },
                    duration: { type: String },
                    video: { type: String },
                    notes: { type: String },
                    notesName: { type: String },
                    assignment: { type: String },
                    assignmentName: { type: String },
                    isLiveClass: { type: Boolean, default: false },
                    liveClass: {
                        startDate: { type: Date, default: Date.now() },
                        endDate: { type: Date, default: Date.now() },
                        streamKey: { type: String },
                        meetingLink: { type: String, default: "" },
                        isCompleted: { type: Boolean, default: false }
                    }
                },
            ],
            project: [
                {
                    title: { type: String },
                    startDate: { type: Date },
                    endDate: { type: Date },
                    projectInfoPdf: { type: String },
                    duration: { type: Number },
                }
            ],
            liveClasses: [
                {
                    topic: { type: String },
                    startDate: { type: Date },
                    endDate: { type: Date },
                    meetingLink: { type: String },
                    duration: { type: Number },
                    isCompleted: { type: Boolean, default: false }
                }
            ]
        }
    ]
});

export default mongoose.model.Batchs || mongoose.model('Batch', BatchSchema);