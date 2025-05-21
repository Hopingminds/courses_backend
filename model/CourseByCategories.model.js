import mongoose from "mongoose";

export const CoursesByCategorieSchema = new mongoose.Schema({
    categoryName :{ 
        type: String
    },
    courses:[{ 
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Courses'
        }
    }],
    packages:[{
        profileName: { type: String },
        from: {type: Number},
        to: {type: Number},
    }],
    whatWillYouLearn: [{ type: String }],
    companies: [{type: String }],
    seats: {type: Number },
});

export default mongoose.model.CoursesByCategories || mongoose.model('CoursesByCategorie', CoursesByCategorieSchema);