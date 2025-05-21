import mongoose from 'mongoose'

export const JobsapplySchema = new mongoose.Schema({
	appliedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    jobApplied:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jobopenings'
    },
    applicationStatus:{
        type: String,
        enum: ['applied', 'opened', 'accepted', 'rejected'],
        default: 'applied'
    }
})

export default mongoose.model.Jobsapplies ||
	mongoose.model('Jobsapply', JobsapplySchema)
