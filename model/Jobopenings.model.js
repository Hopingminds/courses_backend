import mongoose from 'mongoose'

export const JobopeningsSchema = new mongoose.Schema({
	position: {
        type: String,
    },
    company: {
        type: String,
    },
    location: {
        type: String,
    },
    publishDate: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model.Jobopenings || mongoose.model('Jobopenings', JobopeningsSchema)