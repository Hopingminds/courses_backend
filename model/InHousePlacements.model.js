import mongoose from 'mongoose'

export const InHousePlacementsSchema = new mongoose.Schema({
    position: {
        type: String,
        required: [true, "Please provide position"],
    },
    employment_type: {
        type: String,
        required: [true, "Please provide employment_type"],
    },
    key_skills: [{
        type: String,
        required: [true, "Please provide key_skills"],
    }],
    company: {
        type: String,
        required: [true, "Please provide company"],
    },
    role_category: {
        type: String,
        required: [true, "Please provide role_category"],
    },
    work_mode: {
        type: String,
        required: [true, "Please provide work_mode"],
    },
    location: {
        type: String,
        required: [true, "Please provide location"],
    },
    work_experience: {
        isFresher: {
            type: Boolean,
            required: [true, "Please provide isFresher"],
        },
        from: {
            type: Number,
            required: [true, "Please provide work_experience.from"],
        },
        to: {
            type: Number,
            required: [true, "Please provide work_experience.to"],
        },
    },
    annual_salary_range: {
        from: {
            type: Number,
            required: [true, "Please provide annual_salary_range.from"],
        },
        to: {
            type: Number,
            required: [true, "Please provide annual_salary_range.to"],
        },
    },
    company_industry: {
        type: String,
        required: [true, "Please provide company_industry"],
    },
    educational_qualification: [{
        type: String,
        required: [true, "Please provide educational_qualification"],
    }],
    interview_mode: {
        type: String,
        required: [true, "Please provide interview_mode"],
    },
    job_description: {
        type: String,
        required: [true, "Please provide job_description"],
    },
    job_url: {
        type: String,
        required: [true, "Please provide job_url"],
    },
    about_company: {
        type: String,
        required: [true, "Please provide about_company"],
    },
    company_website_link: {
        type: String,
        required: [true, "Please provide company_website_link"],
    },
    company_address: {
        type: String,
        required: [true, "Please provide company_address"],
    },
    logoUrl: {
        type: String,
        required: [true, "Please provide logoUrl"],
        default: "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwcICAgHCAgIBwgHCA0HCAgIDQ8IDQgNFREWFhURExMYHSggJBslGxMTITEhMSkrLjouFx8zRDM4QygvOi0BCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBIgACEQEDEQH/xAAZAAEBAQEBAQAAAAAAAAAAAAAAAQQDAgf/xAA1EAEAAgACBAsGBwEAAAAAAAAAAQIDEQQTITESFDJBUlNicpGSoSJRccLR8DM0QmGxweEk/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/APq6gAEKAAAAACgAAAAAAAAIAAqAIqAAAEgCCgAKAAACgigAAAAAAAAAAAAAAAigIACCoAACgAKigAAAAAAAAAAAAAAAAAAAAIqAIoBkIoBAAoAAAAAAAAAAAAAAAAAAAAAAIBIqAAAKigAAAAAAAAAAAAAAAAAAAAAAAAIoCCgAAAAAAAAAAAzXicTFms7onKsTtiNmfivFo7PlBoGfi0dnynFo7PlBoGfi0dnynFo7PlBoGfi0dnyvM11Voyyzyz2RkDUAAAAAAAAAAIoAAAAAAAAAAM9fx7d75XnHtNrzWc+DXKODzTOWec+K1n/onvfK6YmFFp4UTlPP+4OWBaa2isbp2ZNTlh4PBnhTOcxuy3Q6gPFMSl85rOcRPiz42NrPZr+Hzz1n+ffx81tNZzjZMA2s2k8qO7/bth4kXjZvjfHucdK5Ve7/AGDTO+QnfIAAAAAAAAAAAAAAAAAAAADLX8xPe+VovetKza05RHqz1/Mz3vleNItM4lomdlMorHu2R9QXX3m/D3RuinNEfUxsacT2IzrT9Xvv+3w+/jyzMwUTMzB7raazExsl00vl17s/y4w7aZy692f5BqnfISAAAAAAAAACKAAAAAAAAAADJaeBj2tMTlnns5/ZepxcCZmZw5mZ3zMRt9Xe1K25VYn4vOpwuhHqDjrdH6qfCDW6P1U+EO2pwuhHqanC6EeoOOt0fqp8INbo/VT4Q7anC6EepqcLoR6g5a3R+rnwhzxr620cGLbuDty2zLTqcLoR6rXDpWc61iJ9+8HuQAAAAAAAAAAABIUAAAAAAAAAAAAAAAAAAAAAAAAAAE2goIqEAoAAAAAAAAAAAAAAAAAAAAAAACSryCiAKIAsKigAAAAAAAAAAAAAAAAAAAAAgAgAqKCAAKigogCgAAAAAAAAAAAAAAAAgAgAAAAAAAAAqAKqEAogCgAAAAAAAAACACKgAAAICiACgAAAoAIoAACgAAAAAJKgJCgCAAIAHOAAgAAA/9k="
    },
    publishStatus: {
        type: String,
        required: [true, "Please provide publishStatus"],
        default: "active",
        enum: ['active', 'closed']
    },
    publishDate: {
        type: Date,
        required: [true, "Please provide publishDate"],
        default: Date.now
    },
    lastDate: {
        type: Date,
        required: [true, "Please provide lastDate"],
        default: function () {
            return new Date(+this.publishDate + 5 * 24 * 60 * 60 * 1000); // Adding 5 days in milliseconds
        }
    },
    applicants: [{
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'InHousePlacementApplicants'
        },
        AppliedForJob: {
            type: Boolean,
            default: false,
        }
    }],
}, { timestamps: true })

// Pre-save middleware to update publishStatus if the current date exceeds lastDate
InHousePlacementsSchema.pre('save', function (next) {
    const currentDate = new Date();
    
    // If the lastDate has passed, update publishStatus to 'closed'
    if (this.lastDate < currentDate && this.publishStatus === 'active') {
        this.publishStatus = 'closed';
    }

    next();
});


export default mongoose.model.InHousePlacements || mongoose.model('InHousePlacements', InHousePlacementsSchema)