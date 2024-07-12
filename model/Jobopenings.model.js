import mongoose from 'mongoose'

export const JobopeningsSchema = new mongoose.Schema({
    publichedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hirefromus'
    },
    position: {
        type: String,
    },
    employment_type: {
        type: String
    },
    key_skills: [
        { type: String }
    ],
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
        isFresher:{ type :Boolean},
        from: { type: Number },
        to: { type: Number },
    },
    annual_salary_range: {
        from: { type: Number },
        to: { type: Number },
    },
    salaryType:{ type: String},
    annualSalary: { 
        type: Number
    },
    uptoPackage:{
        type: Number
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
        type: String,
    },
    company_website_link: {
        type: String,
    },
    company_address: {
        type: String,
    },
    logoUrl: {
        type: String,
        default: "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwcICAgHCAgIBwgHCA0HCAgIDQ8IDQgNFREWFhURExMYHSggJBslGxMTITEhMSkrLjouFx8zRDM4QygvOi0BCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAAAAQQDAgf/xAA1EAEAAgACBAsGBwEAAAAAAAAAAQIDEQQTITESFDJBUlNicpGSoSJRccLR8DM0QmGxweEk/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/APq6gAEKAAAAACgAAAAAAAAIAAqAIqAAAEgCCgAKAAACgigAAAAAAAAAAAAAAAigIACCoAACgAKigAAAAAAAAAAAAAAAAAAAAIqAIoBkIoBAAoAAAAAAAAAAAAAAAAAAAAAAIBIqAAAKigAAAAAAAAAAAAAAAAAAAAAAAAIoCCgAAAAAAAAAAAzXicTFms7onKsTtiNmfivFo7PlBoGfi0dnynFo7PlBoGfi0dnynFo7PlBoGfi0dnyvM11Voyyzyz2RkDUAAAAAAAAAAIoAAAAAAAAAAM9fx7d75XnHtNrzWc+DXKODzTOWec+K1n/onvfK6YmFFp4UTlPP+4OWBaa2isbp2ZNTlh4PBnhTOcxuy3Q6gPFMSl85rOcRPiz42NrPZr+Hzz1n+ffx81tNZzjZMA2s2k8qO7/bth4kXjZvjfHucdK5Ve7/AGDTO+QnfIAAAAAAAAAAAAAAAAAAAADLX8xPe+VovetKza05RHqz1/Mz3vleNItM4lomdlMorHu2R9QXX3m/D3RuinNEfUxsacT2IzrT9Xvv+3w+/jyzMwUTMzB7raazExsl00vl17s/y4w7aZy692f5BqnfISAAAAAAAAACKAAAAAAAAAADJaeBj2tMTlnns5/ZepxcCZmZw5mZ3zMRt9Xe1K25VYn4vOpwuhHqDjrdH6qfCDW6P1U+EO2pwuhHqanC6EeoOOt0fqp8INbo/VT4Q7anC6EepqcLoR6g5a3R+rnwhzxr620cGLbuDty2zLTqcLoR6rXDpWc61iJ9+8HuQAAAAAAAAAAABIUAAAAAAAAAAAAAAAAAAAAAAAAAAE2goIqEAoAAAAAAAAAAAAAAAAAAAAAAACSryCiAKIAsKigAAAAAAAAAAAAAAAAAAAAAgAgAqKCAAKigogCgAAAAAAAAAAAAAAAAgAgAAAAAAAAAqAKqEAogCgAAAAAAAAACACKgAAAICiACgAAAoAIoAACgAAAAAJKgJCgCAAIAHOAAgAAA/9k="
    },
    publishStatus: {
        type: String,
        default: "active",
        enum: ['active', 'closed']
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    lastDate: {
        type: Date,
        default: function() {
            return new Date(+this.publishDate + 5 * 24 * 60 * 60 * 1000); // Adding 5 days in milliseconds
        }
    }
})

export default mongoose.model.Jobopenings || mongoose.model('Jobopenings', JobopeningsSchema)