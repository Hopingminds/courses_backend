import mongoose from "mongoose";

export const CoursesSchema = new mongoose.Schema({
    courseID: { type: String },
    title:{type: String},
    slug:{type: String},
    featured_image:{type: String},
    featured_video:{type: String},
    duration: {type: String},
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
                    assignment: {type:  String},
                }
            ]
        }
    ],
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructors'
    },
    faqs:[{
        question: {type: String},
        answer: {type: String}
    }],
    reviews:[
        { 
            userID: String,
            review: {type: String},
            reating: {type: Number}
        }
    ],
    IsMinorDegreeCourse:{
        type: Boolean, default: false
    },
    display: {type: Boolean, default: true},
    credits: { type: Number }
});

export default mongoose.model.Courses || mongoose.model('Courses', CoursesSchema);