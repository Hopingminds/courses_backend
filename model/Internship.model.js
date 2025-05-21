import mongoose from "mongoose";

export const InternshipSchema = new mongoose.Schema({
    internshipId: { type: String },
    title: { type: String },
    slug: { type: String },
    overview: { type: String },
    registration_price: { type: Number },
    base_price: { type: Number },
    discount_percentage: { type: Number },
    category: { type: String },
    subcategory: { type: String },
    duration: { type: Number, default: 0 },
    total_lessons: { type: Number },
    level: { type: String, default: "Beginner" },
    credits: { type: Number },
    enrollments: { type: Number },
    internshipStartDate: { type: Date, default: Date.now },
    bannerImg: { type: String },
    featured_image: { type: String },
    featured_video: { type: String },
    learningOutcome: [{ type: String }],
    placementOpportunities: [{ type: String }],
    display: { type: Boolean, default: true },
    internshipCategory: {
        type: String,
        enum: ["internship", "liveInternship", "hybrid", "OnlineInternship", "OfflineInternship"],
        default: "internship"
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        default: null
    },
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
                                classUrl: { type: String },
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
    ],
    faqs: [
        {
            question: { type: String },
            answer: { type: String }
        }
    ],
    reviews: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users'
            },
            rating: { type: Number },
            review: { type: String },
        }
    ],
    testimonials: [
        {
            reviewVideo: { type: String },
            rating: { type: Number },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users'
            },
            review: { type: String }
        }
    ],
    internshipPeriod: {
        type: String,
        enum: ["6 Weeks", "6 Months"]
    },
    companies_hiring: [
        {
            companyName: { type: String },
            avgpkg: {
                from: { type: Number },
                to: { type: Number }
            }
        }
    ],
});

export default mongoose.models.Internship || mongoose.model('Internship', InternshipSchema);
