import slugify from "slugify";
import CoursesModel from "../model/Courses.model.js";
/** POST: http://localhost:8080/api/addcourse
* @body : {
    
}
*/
export async function addcourse(req, res) {
	try {
		const courseData = req.body
        courseData.slug = slugify(courseData.courses_title)
		let course = new CoursesModel(courseData)
		await course.save()
		res.status(201).json({ success: true, msg: 'Course added successfully' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}