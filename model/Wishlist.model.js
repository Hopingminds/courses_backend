import mongoose from "mongoose";
import CoursesModel from "./Courses.model.js";
export const WishlistSchema = new mongoose.Schema({
    _id :{ type: mongoose.Schema.Types.ObjectId, 
        auto: true, 
        required: true 
    },
    courses: [
        {
            course:{
                type: mongoose.Schema.Types.ObjectId,
                ref: CoursesModel,
            }
        }
    ]
}, { _id: false });

export default mongoose.model.Wishlists || mongoose.model('Wishlist', WishlistSchema);