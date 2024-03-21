import mongoose from 'mongoose'

export const CategoriesSchema = new mongoose.Schema({
	firstName: { type: String },
	lastName: { type: String },
	about: { type: String },
	profile: { type: String },
    email: {type: String},
    password: {type: String},
	total_students: { type: String, default: 0 },
	total_lessons: { type: Number, default: 0 },
	experience: { type: String },
	social_links: [
		{
			website_name: { type: String },
			profile_url: { type: String },
		},
	]
})

export default mongoose.model.Categories ||
	mongoose.model('Categories', CategoriesSchema)
