import mongoose from "mongoose";

export const CoursesSchema = new mongoose.Schema({
    title:{type: String},
    slug:{type: String},
    duration: {type: String},
    enrollments: {type: Number},
    level: {type: String, default: "Beginner"},
    total_lessons: {type: Number},
    total_quiz: {type: Number},
    overview:{type: String},
    base_price:{type: Number},
    discount_percentage:{type: Number},
    curriculum:[
        {
            chapter_name: {type: String},
            lessons:[
                {
                    lesson_name:{type: String},
                    duration: {type: String}
                }
            ]
        }
    ],
    instructor:{
        firstName:{type: String},
        lastName:{type: String},
        about:{type: String},
        total_students: {type: String},
        total_lessons: {type: Number},
        experience:{type: String},
        social_links:[
            {
                website_name:{ type: String},
                profile_url: {type: String}
            }
        ]
    },
    faqs:[{
        question: {type: String},
        answer: {type: String}
    }],
    reviews:[
        { 
            userID: mongoose.Schema.Types.ObjectId,
            review: {type: String},
            reating: {type: Number}
        }
    ]
});

export default mongoose.model.Courses || mongoose.model('Courses', CoursesSchema);