import mongoose from 'mongoose'

export const InHousePlacementApplicantSchema = new mongoose.Schema({
    name: { type: String},
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: Number,
        unique: true,
    },
    year_of_passing:{
        type: Number,
    },
    resume:{
        type: String,
    },
})

export default mongoose.model.InHousePlacementApplicants || mongoose.model('InHousePlacementApplicants', InHousePlacementApplicantSchema)