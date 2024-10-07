import mongoose from 'mongoose'

export const FreelanceSchema = new mongoose.Schema({
    position: {
        type: String,
        required: true,
    },
    employment_type: {
        type: String,
        required: true,
    },
    key_skills: [{ 
        type: String,
        required: true,
    }],
    company: {
        type: String,
        required: true,
    },
    role_category: {
        type: String,
        required: true,
    },
    work_mode: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    work_experience: {
        isFresher: { 
            type: Boolean, 
            required: true, 
        },
        from: { 
            type: Number,
            required: true,
        },
        to: { 
            type: Number,
            required: true,
        },
    },
    annual_salary_range: {
        from: { 
            type: Number,
            required: true,
        },
        to: { 
            type: Number,
            required: true,
        },
    },
    company_industry: {
        type: String,
        required: true,
    },
    educational_qualification: [{
        type: String,
        required: true,
    }],
    interview_mode: {
        type: String,
        required: true,
    },
    job_description: {
        type: String,
        required: true,
    },
    job_url: {
        type: String,
        required: true,
    },
    about_company: {
        type: String,
        required: true,
    },
    company_website_link: {
        type: String,
        required: true,
    },
    company_address: {
        type: String,
        required: true,
    },
    logoUrl: {
        type: String,
        required: true,
        default: "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwcICAgHCAgIBwgHCA0HCAgIDQ8IDQgNFREWFhURExMYHSggJBslGxMTITEhMSkrLjouFx8zRDM4QygvOi0BCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAAAAQQDAgf/xAA1EAEAAgACBAsGBwEAAAAAAAAAAQIDEQQTITESFDJBUlNicpGSoSJRccLR8DM0QmGxweEk/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/APq6gAEKAAAAACgAAAAAAAAIAAqAIqAAAEgCCgAKAAACgigAAAAAAAAAAAAAAAigIACCoAACgAKigAAAAAAAAAAAAAAAAAAAAIqAIoBkIoBAAoAAAAAAAAAAAAAAAAAAAAAAIBIqAAAKigAAAAAAAAAAAAAAAAAAAAAAAAIoCCgAAAAAAAAAAAzXicTFms7onKsTtiNmfivFo7PlBoGfi0dnynFo7PlBoGfi0dnynFo7PlBoGfi0dnyvM11Voyyzyz2RkDUAAAAAAAAAAIoAAAAAAAAAAM9fx7d75XnHtNrzWc+DXKODzTOWec+K1n/onvfK6YmFFp4UTlPP+4OWBaa2isbp2ZNTlh4PBnhTOcxuy3Q6gPFMSl85rOcRPiz42NrPZr+Hzz1n+ffx81tNZzjZMA2s2k8qO7/bth4kXjZvjfHucdK5Ve7/AGDTO+QnfIAAAAAAAAAAAAAAAAAAAADLX8xPe+VovetKza05RHqz1/Mz3vleNItM4lomdlMorHu2R9QXX3m/D3RuinNEfUxsacT2IzrT9Xvv+3w+/jyzMwUTMzB7raazExsl00vl17s/y4w7aZy692f5BqnfISAAAAAAAAACKAAAAAAAAAADJaeBj2tMTlnns5/ZepxcCZmZw5mZ3zMRt9Xe1K25VYn4vOpwuhHqDjrdH6qfCDW6P1U+EO2pwuhHqanC6EeoOOt0fqp8INbo/VT4Q7anC6EepqcLoR6g5a3R+rnwhzxr620cGLbuDty2zLTqcLoR6rXDpWc61iJ9+8HuQAAAAAAAAAAABIUAAAAAAAAAAAAAAAAAAAAAAAAAAE2goIqEAoAAAAAAAAAAAAAAAAAAAAAAACSryCiAKIAsKigAAAAAAAAAAAAAAAAAAAAAgAgAqKCAAKigogCgAAAAAAAAAAAAAAAAgAgAAAAAAAAAqAKqEAogCgAAAAAAAAACACKgAAAICiACgAAAoAIoAACgAAAAAJKgJCgCAAIAHOAAgAAA/9k="
    },
    publishStatus: {
        type: String,
        required: true,
        default: "active",
        enum: ['active', 'closed']
    },
    publishDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastDate: {
        type: Date,
        required: true,
        default: function () {
            return new Date(+this.publishDate + 5 * 24 * 60 * 60 * 1000); // Adding 5 days in milliseconds
        }
    }
})

export default mongoose.model.Freelances || mongoose.model('Freelance', FreelanceSchema)