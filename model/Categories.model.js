import mongoose from "mongoose";

export const CategoriesSchema = new mongoose.Schema({
    _id :{ type: mongoose.Schema.Types.ObjectId, 
        auto: true, 
        required: true 
    },
    Category_Name:{
        type: String
    },
    Category_image:{
        type: String
    },
    Subcategories:[
        {
            _id :{ type: mongoose.Schema.Types.ObjectId, 
                auto: true, 
                required: true 
            },
            Subcategory_Name:{
                type: String
            },
            Subcategory_image:{
                type: String
            },
        }
    ]
});

export default mongoose.model.Categories || mongoose.model('Categories', CategoriesSchema);