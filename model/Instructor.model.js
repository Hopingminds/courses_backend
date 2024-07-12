import mongoose from 'mongoose'

export const InstructorSchema = new mongoose.Schema({
	name: { type: String },
	bio: { type: String },
	profile: { type: String },
    email: {type: String},
    phone: {type: Number},
    password: {type: String},
	experience: { type: String },
	experties: { type: String},
	workExperience: { type: String},
	noOfStudents: { type: Number },
	noOfLessons: { type: Number },
	social_links: [
		{
			website_name: { type: String },
			profile_url: { type: String },
		},
	],
	token: {type: String}
})

export default mongoose.model.Instructors ||
	mongoose.model('Instructor', InstructorSchema)
