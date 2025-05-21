import mongoose from "mongoose";

export const RegisterUserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: Number,
    },
    name: { type: String},
    college: {type:String},
    degree: {type:String},
    stream: {type:String},
    yearOfPassing: {type: Number},
    chosenCategory: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CoursesByCategorie'
    },


    // sawayam  all fields
  
    gender: { type: String },                // Swayam
    age_group: { type: String },             // Swayam
    country_of_residence: { type: String },  // Swayam
    pincode: { type: String },               // Swayam
    state_of_residence: { type: String },    // Swayam
    city_of_residence: { type: String },     // Swayam
    student_type: { type: String },          // Swayam
    institution_state: { type: String },     // Swayam
    university: { type: String },            // Swayam
    year_of_study: { type: String },         // Swayam
    roll_number: { type: String },           // Swayam
    semester: { type: String },              // Swayam
    abc_id: { type: String, default: "I don't have ABC ID" } // Swayam


}, { timestamps: true });

export default mongoose.model.RegisterUsers || mongoose.model('RegisterUser', RegisterUserSchema);
