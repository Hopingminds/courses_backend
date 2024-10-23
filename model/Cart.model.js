import mongoose from "mongoose";
import CoursesModel from "./Courses.model.js";

export const CartSchema = new mongoose.Schema({
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
    ],
    internships:[
        {
            internship:{
                type: mongoose.Schema.Types.ObjectId,
                ref:'Internship'
            }
        }
    ]
}, { _id: false });

export default mongoose.model.Carts || mongoose.model('Cart', CartSchema);