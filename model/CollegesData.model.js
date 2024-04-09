import mongoose from "mongoose";

export const CollegeSchema = new mongoose.Schema({
    university: {type: String},
    college: {type: String},
    college_type: {type: String},
    state: {type: String},
    district: {type: String},
});

export default mongoose.model.Colleges || mongoose.model('College', CollegeSchema);