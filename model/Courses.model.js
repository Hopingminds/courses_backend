import mongoose from "mongoose";

export const CoursesSchema = new mongoose.Schema({
    courseID: { type: String },
    title:{type: String},
    slug:{type: String},
    featured_image:{type: String},
    featured_video:{type: String},
    duration: {type: Number, default:0},
    enrollments: {type: Number},
    level: {type: String, default: "Beginner"},
    total_lessons: {type: Number},
    total_quiz: {type: Number},
    category:{type: String},
    subcategory:{type: String},
    base_price:{type: Number},
    discount_percentage:{type: Number},
    rating:{type: Number},
    overview:{type: String},
    courseStartDate: {type: Date, default: Date.now()},
    whatWillILearn:[
        {
            type: String
        }
    ],
    curriculum:[
        {
            chapter_name: {type: String},
            lessons:[
                {
                    lesson_name:{type: String},
                    duration: {type: String},
                    video: {type: String},
                    notes: {type:  String},
                    notesName: {type:  String},
                    assignment: {type:  String},
                    assignmentName: {type:  String},
                    isLiveClass: {type:Boolean, default:false},
                    liveClass:{
                        startDate: {type: Date, default: Date.now()},
                        endDate: {type: Date, default: Date.now()},
                        meetingLink: {type: String, default: ""},
                        isCompleted : {type: Boolean, default: false}
                    }
                },
            ],
            project:[
                {
                    title: {type: String},
                    startDate: {type: Date},
                    endDate: {type: Date},
                    projectInfoPdf: {type: String},
                    duration: {type: Number},
                }
            ],
            liveClasses:[
                {
                    topic: {type: String},
                    startDate: {type: Date},
                    endDate: {type: Date},
                    meetingLink: {type: String},
                    duration: {type: Number},
                    isCompleted : {type: Boolean, default: false}
                }
            ]
        }
    ],
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor'
    },
    faqs:[{
        question: {type: String},
        answer: {type: String}
    }],
    liveClasses:[{
        topic: {type: String},
        date: {type: Date},
        time: {type: String},
        meetingLink: {type: String}
    }],
    reviews:[
        { 
            userID: String,
            review: {type: String},
            reating: {type: Number},
            userName: {type: String},
            userProfileImg: {type: String}
        }
    ],
    testimonials:[{
        reviewVideo: {type: String},
        rating: {type: Number},
        userName: {type: String},
        review: {type: String}
    }],
    learningOutcome:[
        {type: String}
    ],
    courseType: {
        type: String,
        enum: ['public' , 'minorDegree', 'internship'],
        default: 'public'
    },
    credits: { type: Number },
    internshipPeriod: {
        type: String,
        enum: ['6 Weeks' , '6 Months']
    },
    display: {type: Boolean, default: true},
    bannerImg: {type: String},
    assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assessment" }],
    courseCategory: {
        type: String,
        enum: ['course', 'liveCourse'],
        default: 'course'
    },
    companies:[{
        companyName:{type: String},
        avgpkg:{
            from:{type: Number},
            to:{type: Number}
        }
    }],
    placementOpportunities:[{type: String}]
});

export default mongoose.model.Courses || mongoose.model('Courses', CoursesSchema);