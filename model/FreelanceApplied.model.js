import mongoose from 'mongoose'

export const FreelanceAppliedSchema = new mongoose.Schema({
    appliedAppliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    jobApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Freelance'
    },
    applicationStatus: {
        type: String,
        enum: ['applied', 'opened', 'accepted', 'rejected'],
        default: 'applied'
    }
})

export default mongoose.model.FreelanceApplieds || mongoose.model('FreelanceApplied', FreelanceAppliedSchema)