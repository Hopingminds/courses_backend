import mongoose from "mongoose";

export const BatchInternshipSchema = new mongoose.Schema({
    batchId: {
        type: String,
        unique: true,
    },
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true,
    },
    batchName: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return this.startDate < value;  // Ensuring endDate is after startDate
            },
            message: "End date must be after start date"
        }
    },
    batchlimit: {
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
            unitName: { type: String },
            chapters: [
                {
                    chapter_name: { type: String },
                    lessons: [
                        {
                            lesson_name: { type: String },
                            duration: { type: Number },
                            video: { type: String },
                            notes: { type: String },
                            notesName: { type: String },
                            assignment: { type: String },
                            assignmentName: { type: String },
                            isLiveClass: { type: Boolean, default: false },
                            liveClass: {
                                streamKey: { type: String },
                                isCompleted: { type: Boolean, default: false },
                                startDate: { type: Date, default: Date.now },
                                endDate: { type: Date, default: Date.now },
                            }
                        }
                    ]
                }
            ],
            project: [
                {
                    title: { type: String },
                    startDate: { type: Date },
                    endDate: { type: Date },
                    projectInfoPdf: { type: String },
                    duration: { type: Number }
                }
            ]
        }
    ]
});

export default mongoose.model.BatchInternships || mongoose.model('BatchInternship', BatchInternshipSchema);