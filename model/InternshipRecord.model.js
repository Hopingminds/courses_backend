import mongoose from "mongoose";

export const InternshipRecordSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internshipID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0 // Progress in percentage
    },
    completionStatus: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
    },
    viewedLessons: [{
        lessonID: {
            type: mongoose.Schema.Types.ObjectId,
        },
        joinedAt:{
            type: Date,
            default: Date.now
        },
        viewedDuration: {
            type: Number, // In Seconds
            default: 0,
        }
    }],
    submittedAssignments: [
        {
            lessonId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            fileUrl: {
                type: String, // Store file path or cloud URL
                required: true
            },
            submittedAt: {
                type: Date,
                default: Date.now
            },
            graded: {
                type: Boolean,
                default: false
            },
            grade: {
                from: {
                    type: Number,
                    default: null
                },
                from: {
                    type: Number,
                    default: null
                },
            },
            feedback: {
                type: String,
                default: null
            }
        }
    ],
    offlineClassAttendance: [
        {
            lessonId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            isPresent:{
                type:Boolean,
                default: false
            }
        }
    ],
    lastAccessed: {
        type: Date,
    }
}, { timestamps: true });

/**
 * Pre-save middleware to automatically update progress & completion status
 */
InternshipRecordSchema.pre("save", async function (next) {
    try {
        const internship = await mongoose.model('Internship').findById(this.internshipID);
        if (!internship) return next(new Error("Internship not found"));

        let totalLessons = 0;
        internship.curriculum.forEach(unit => {
            unit.chapters.forEach(chapter => {
                totalLessons += chapter.lessons.length;
            });
        });

        const completedLessons = this.viewedLessons.length;

        this.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        if (this.progress === 100) {
            this.completionStatus = "Completed";
        } else if (this.progress > 0) {
            this.completionStatus = "In Progress";
        } else {
            this.completionStatus = "Not Started";
        }

        this.lastAccessed = new Date();

        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model.InternshipRecords || mongoose.model('InternshipRecord', InternshipRecordSchema);
