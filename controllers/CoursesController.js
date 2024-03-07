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
    let {category,subcategory,sort,price_min,price_max,search,populate} = req.query
	try {
		let query = {};

		// Add category and subcategory to the query if provided
		if (category) {
			query.category = category;
		}
		if (subcategory) {
			query.subcategory = subcategory;
		}

		// Add price range to the query if provided
		if (price_min !== undefined && price_max !== undefined) {
			query.base_price = { $gte: price_min, $lte: price_max };
		} else if (price_min !== undefined) {
			query.base_price = { $gte: price_min };
		} else if (price_max !== undefined) {
			query.base_price = { $lte: price_max };
		}

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

		// Build the sort object based on the 'sort' parameter
		let sortObj = {};
		if (sort === 'price_asc') {
			sortObj.base_price = 1;
		} else if (sort === 'price_desc') {
			sortObj.base_price = -1;
		}
		
		const products = await CoursesModel.find(query).sort(sortObj).populate(populate)
		res.status(200).json(products)
	} catch (err) {
		res.status(500).send('Internal Server Error')
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