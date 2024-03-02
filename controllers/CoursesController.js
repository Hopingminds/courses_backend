import slugify from "slugify";
import CoursesModel from "../model/Courses.model.js";
/** POST: http://localhost:8080/api/addcourse
* @body : {
    dummy.json
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

/** GET: http://localhost:8080/api/courses */
export async function getCourses(req, res) {
	try {
        const courses = await CoursesModel.find({})

        if (!courses) {
            return res.status(404).json({ success: false, message: 'Courses not found' });
        }

        res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/course/:coursename */
export async function getCourseBySlug(req, res) {
	try {
        const { coursename } = req.params
        const course = await CoursesModel.findOne({slug:coursename})

        if (!course) {
            return res.status(404).json({ success: false, message: 'Courses not found' });
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}