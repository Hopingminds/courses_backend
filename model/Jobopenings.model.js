import mongoose from 'mongoose'

export const JobopeningsSchema = new mongoose.Schema({
    position: {
        type: String,
    },
    employment_type: {
        type: String
    },
    key_skills: {
        type: String
    },
    company: {
        type: String,
    },
    role_category: {
        type: String,
    },
    work_mode: {
        type: String,
    },
    location: {
        type: String,
    },
    work_experience: {
        from: { type: String },
        to: { type: String },
    },
    annual_salary_range: {
        from: { type: String },
        to: { type: String },
    },
    company_industry: {
        type: String,
    },
    educational_qualification: {
        type: String,
    },
    specialization: {
        type: String,
    },
    interview_mode: {
        type: String,
    },
    job_description: {
        type: String,
    },
    about_company: {

    },
    company_website_link: {
        type: String,
    },
    company_address: {
        type: String,
    },
    logoUrl: {
        type: String,
    },
    publishStatus: {
        type: String,
        default: "active",
        enum: ['active', 'closed']
    },
    publishDate: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model.Jobopenings || mongoose.model('Jobopenings', JobopeningsSchema)