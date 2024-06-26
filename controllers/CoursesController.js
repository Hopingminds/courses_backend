import slugify from 'slugify'
import cartModel from '../model/Cart.model.js'
import wishlistModel from '../model/Wishlist.model.js'
import CoursesModel from '../model/Courses.model.js'
import UserModel from '../model/User.model.js'
import OrdersModel from '../model/Orders.model.js'
import { populate } from 'dotenv'
// helper function
function getRandomSubset(arr, size) {
	const shuffled = arr.sort(() => 0.5 - Math.random())
	return shuffled.slice(0, size)
}

/** POST: http://localhost:8080/api/addcourse
* @body : {
    dummy.json
}
*/
export async function addcourse(req, res) {
	try {
		const courseData = req.body
		courseData.slug = slugify(courseData.title)
		let course = new CoursesModel(courseData)
		await course.save()
		res.status(201).json({
			success: true,
			msg: 'Course added successfully',
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

/** GET: http://localhost:8080/api/courses */
export async function getCourses(req, res) {
	let {
		category,
		subcategory,
		sort,
		price_min,
		price_max,
		search,
		minordegree,
		credits,
		type
	} = req.query
	try {
		let query = {}

		// Add category and subcategory to the query if provided
		if (category) {
			query.category = category
		}
		if (subcategory) {
			query.subcategory = subcategory
		}
		if (type) {
			query.courseType = type
		}
		if (minordegree) {
			query.IsMinorDegreeCourse = minordegree
		}
		
		if (credits) {
			query.credits = credits
		}

		// Add price range to the query if provided
		if (price_min !== undefined && price_max !== undefined) {
			query.base_price = { $gte: price_min, $lte: price_max }
		} else if (price_min !== undefined) {
			query.base_price = { $gte: price_min }
		} else if (price_max !== undefined) {
			query.base_price = { $lte: price_max }
		}

		if (search) {
			query.title = { $regex: search, $options: 'i' }
		}

		// Handle courseType logic
		if (type === 'internship') {
			query.courseType = 'internship'
		} else if (type === 'minorDegree') {
			query.courseType = 'minorDegree'
		} else {
			query.courseType = { $ne: 'internship' }
		}

		// Build the sort object based on the 'sort' parameter
		let sortObj = {}
		sortObj.display = -1
		query.display = { $ne: false};
		if (sort === 'price_asc') {
			sortObj.base_price = 1
		} else if (sort === 'price_desc') {
			sortObj.base_price = -1
		}
		sortObj.courseCategory = -1;
		const courses = await CoursesModel.find(query)
			.sort(sortObj)
			.populate('instructor').lean()
		let filterData = courses.map((course)=>{
			if (course.instructor) {
				let {instructor, ...rest} = course
				let {password, token, ...insRest} = instructor
				return {...rest, instructor:insRest}
			}
			return course
		})
		res.status(200).send({ success: true, courses:filterData, })
	} catch (err) {
		console.log(err)
		res.status(500).send({success: false, message: 'Internal Server Error'})
	}
}

/** GET: http://localhost:8080/api/coursesforadmin */
export const getAllCourses = async (req, res) => {
    try {
        const courses = await CoursesModel.find().populate('instructor assessments');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/** GET: http://localhost:8080/api/recommendedcourses */
export async function getRecommendedCourses(req, res) {
	try {
		const courses = await CoursesModel.find({}).find({ display: true }).populate('instructor').lean()
		const recommendedCourses = getRandomSubset(courses, 4)
		let filterData = recommendedCourses.map((course)=>{
			if (course.instructor) {
				let {instructor, ...rest} = course
				let {password, token, ...insRest} = instructor
				return {...rest, instructor:insRest}
			}
			return course
		})
		res.status(200).send({ success: true, recommendedCourses:filterData })
	} catch (err) {
		console.log(err)
		res.status(500).send({ success: false, message: 'Internal Server Error' })
	}
}

/** GET: http://localhost:8080/api/course/:coursename */
export async function getCourseBySlug(req, res) {
	try {
		const { coursename } = req.params
		const course = await CoursesModel.findOne({ slug: coursename }).populate('instructor').populate({ path: 'assessments',select: '-questions' }).lean()

		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: 'Courses not found' })
		}

		let filterData = ( course )=>{
			if (course.instructor) {
				let {instructor, ...rest} = course
				let {password, token, ...insRest} = instructor
				return {...rest, instructor:insRest}
			}
			return course
		}

		res.status(200).json({ success: true, course:filterData(course) })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

export async function getUserCourseBySlug(req, res) {
	function getCourseDataBySlug(data, slug) {
		// Loop through the purchased_courses array
		for (let course of data.purchased_courses) {
			// Check if the course slug matches the one we're looking for
			if (course.course.slug === slug) {
				// Return the matching course data
				return {
					course: course.course,
					completed_lessons: course.completed_lessons,
					completed_assignments: course.completed_assignments,
				}
			}
		}
		// If no course matches, return null or an appropriate message
		return null
	}

	try {
		const { email } = req.params
		const { coursename } = req.params
		const user = await UserModel.findOne({ email }).populate({
			path: 'purchased_courses.course',
			populate: { path: 'instructor', select: '-token -password' }
		})

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: 'User not found' })
		}

		const courseData = getCourseDataBySlug(user, coursename)

		res.status(200).json({ success: true, data: courseData })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** PUT: https://localhost:8080/api/updatecourse */
export async function updateCourse(req, res) {
	const body = req.body
	try {
		CoursesModel.updateOne({ _id: body._id }, body)
			.exec()
			.then(()=>{
				return res
					.status(200)
					.json({ message: 'Course Updated Successfully!', success: true })
			})
			.catch((error)=>{
				return res
					.status(500)
					.json({ message: 'Internal server error', success: false, error })
			})
	} catch (error) {
		
	}
}

/** DELETE: https://localhost:8080/api/deletecourse 
	@body {
		_id: 13132cxn237678c53667
	}
*/
export async function deleteCourse(req, res) {
	try {
		const {_id} = req.body
		CoursesModel.findByIdAndDelete(_id).exec()
		.then(()=>{
			return res
			.status(200)
			.json({ message: 'Course Deleted Successfully!', success: true })
		})
		.catch((error)=>{
			return res
			.status(500)
			.json({ message: 'Internal server error', success: false, error })
		})
	} catch (error) {
		return res
			.status(500)
			.json({ message: 'Internal server error', success: false, error })
	}
}

/** PUT: http://localhost:8080/api/purchasecourse 
 * @param: {
    "header" : "Bearer <token>"
}
body: {
    "courses": [
        "65eee9fa38d32c2479937d44"
        "65eee9fa38d32c2479937d45"
        "65eee9fa38d32c2479937d46"
    ]
	"orderDetails": {
		"name": "Sahil Kumar",
		"address": "475-B",
		"zip": 1442002,
		"country": "India",
		"state": "Punjab",
		"gstNumber": "1234PKLKUP",
	}
}
*/
export async function purchasedCourse(req, res) {
	try {
		const { userID } = req.user
		const { courses, orderDetails } = req.body

		if (
			!userID ||
			!courses ||
			!orderDetails ||
			!Array.isArray(courses) ||
			courses.length === 0
		) {
			return res
				.status(400)
				.json({
					message: 'User ID, orderDetails and an array of course IDs are required',
				})
		}

		const user = await UserModel.findById(userID)

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const coursesNotFound = []
		const coursesAlreadyPurchased = []

		for (const courseId of courses) {
			// Check if the course is already purchased
			const alreadyPurchased = user.purchased_courses.some((course) =>
				course.course.equals(courseId)
			)
			if (alreadyPurchased) {
				coursesAlreadyPurchased.push(courseId)
			} else {
				const course = await CoursesModel.findById(courseId)

				if (!course || !course.display) {
					coursesNotFound.push(courseId)
				} else {
					user.purchased_courses.push({ course: courseId })
				}
			}
		}

		if (coursesNotFound.length > 0) {
			return res
				.status(404)
				.json({ message: 'Some courses not found', coursesNotFound })
		}

		if (coursesAlreadyPurchased.length > 0) {
			return res
				.status(400)
				.json({
					message: 'Some courses already purchased',
					coursesAlreadyPurchased,
					success: true,
				})
		}

		let orderData = {...orderDetails, purchasedBy: userID}
		const order = new OrdersModel(orderData)
		
		await order.save()
		await user.save()

		return res
			.status(200)
			.json({ message: 'Courses purchased successfully', success: true })
	} catch (error) {
		return res
			.status(500)
			.json({ message: 'Internal server error', success: false })
	}
}

/** PUT: http://localhost:8080/api/blockcourses 
 * @param: {
    "header" : "Bearer <token>"
}
body: {
    {
	"email": "sahilkumar142002@gmail.com",
	"courses": [
			"65eee9fa38d32c2479937d44",
			"65eeea1438d32c2479937e28"
		]
	}
}
*/
export async function blockCourses(req, res) {
	try {
		const { email, courses } = req.body

		if (
			!email ||
			!courses ||
			!Array.isArray(courses) ||
			courses.length === 0
		) {
			return res
				.status(400)
				.json({
					message: 'User ID and an array of course IDs are required',
				})
		}

		const user = await UserModel.findOne({email})

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const coursesNotFound = []
		const coursesAlreadyPurchased = []

		for (const courseId of courses) {
			// Check if the course is already purchased
			const alreadyPurchased = user.blocked_courses.some((course) =>
				course.equals(courseId)
			)
			if (alreadyPurchased) {
				coursesAlreadyPurchased.push(courseId)
			} else {
				const course = await CoursesModel.findById(courseId)

				if (!course) {
					coursesNotFound.push(courseId)
				} else {
					user.blocked_courses.push(courseId)
				}
			}
		}

		if (coursesNotFound.length > 0) {
			return res
				.status(404)
				.json({ message: 'Some courses not found', coursesNotFound })
		}

		if (coursesAlreadyPurchased.length > 0) {
			return res
				.status(400)
				.json({
					message: 'Some courses already blocked',
					coursesAlreadyPurchased,
					success: true,
				})
		}
		await user.save()

		return res
			.status(200)
			.json({ message: 'Courses blocked successfully', success: true })
	} catch (error) {
		console.error(error)
		return res
			.status(500)
			.json({ message: 'Internal server error', success: false })
	}
}

/** POST: http://localhost:8080/api/addtocart
body: {
    "email": "example@gmail.com",
    "courseid": "65c4ba60866d0d5a6fc4a82b",
    "quantity":1,
}
*/
export async function addToCart(req, res) {
	let userID = req.userID
	try {
		const { courseid } = req.body

		const course = await CoursesModel.findById(courseid)
		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: 'course not found' })
		}
		// Find the cart for the user
		let cart = await cartModel
			.findOne({ _id: userID })
			.populate('courses.course')

		// If the user has no cart, create a new one
		if (!cart) {
			cart = new cartModel({ _id: userID, courses: [] })
		}

		const existingCartIndex = cart.courses.findIndex((p) =>
			p.course.equals(course._id)
		)
		if (existingCartIndex == -1) {
			cart.courses.push({ course: courseid })
		}

		await cart.save()

		res.status(201).json({
			success: true,
			msg: 'Course added to cart successfully',
			data: cart.courses,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

/** POST: http://localhost:8080/api/removefromcart
body: {
    "email": "example@gmail.com",
    "courseid": "65c4ba60866d0d5a6fc4a82b",
}
*/
export async function removeFromCart(req, res) {
	let userID = req.userID
	try {
		const { courseid } = req.body

		const course = await CoursesModel.findById(courseid)
		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: 'course not found' })
		}

		// Find the cart for the user
		let cart = await cartModel
			.findOne({ _id: userID })
			.populate('courses.course')

		// If the user has no cart, return with a message
		if (!cart) {
			return res
				.status(404)
				.json({
					success: false,
					message: 'Cart not found for the user',
				})
		}

		const existingCartIndex = cart.courses.findIndex((p) =>
			p.course.equals(courseid)
		)

		// If the course is not found in the cart, return with a message
		if (existingCartIndex === -1) {
			return res
				.status(404)
				.json({
					success: false,
					message: 'course not found in the cart',
				})
		}

		cart.courses.splice(existingCartIndex, 1)

		await cart.save()

		res.status(200).json({
			success: true,
			message: 'Operation successful',
			data: cart.courses,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** DELETE: http://localhost:8080/api/deletecart */
export async function deleteCart(req, res) {
    let userID = req.userID;
    try {
        // Find the cart for the user
        let cart = await cartModel.findOne({ _id: userID });

        // If the user has no cart, return with a message
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found for the user',
            });
        }

        // Empty the cart by setting the courses array to an empty array
        cart.courses = [];

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart emptied successfully',
            data: cart.courses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

/** GET: http://localhost:8080/api/getcart
query: {
    "email": "example@gmail.com",
}
*/
export async function getcart(req, res) {
	let userID = req.userID
	try {
		// Find the cart document and populate the courses field with course data
		const cart = await cartModel
			.findOne({ _id: userID })
			.populate('courses.course')

		if (!cart) {
			return res
				.status(404)
				.json({ success: false, message: 'Cart not found' })
		}

		res.status(200).json({ success: true, cart: cart.courses })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** POST: http://localhost:8080/api/addtowishlist
body: {
    "email": "example@gmail.com",
    "courseid": "65c4ba60866d0d5a6fc4a82b",
}
*/
export async function addtowishlist(req, res) {
	let userID = req.userID
	try {
		const { courseid } = req.body

		// Fetch the course data
		const course = await CoursesModel.findById(courseid)
		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: 'course not found' })
		}

		// Find the wishlist for the user
		let wishlist = await wishlistModel.findOne({ _id: userID })

		// If the user has no wishlist, create a new one
		if (!wishlist) {
			wishlist = new wishlistModel({ _id: userID, courses: [] })
		}

		const existingCartIndex = wishlist.courses.findIndex((p) =>
			p.course.equals(course._id)
		)

		if (existingCartIndex == -1) {
			wishlist.courses.push({ course: course._id })
		}

		await wishlist.save()
		res.status(201).json({
			success: true,
			msg: 'course added to wishlist successfully',
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, msg: 'Internal server error' })
	}
}

/** POST: http://localhost:8080/api/removefromwishlist
body: {
    "email": "example@gmail.com",
    "courseid": "65c4ba60866d0d5a6fc4a82b",
}
*/
export async function removeFromWishlist(req, res) {
	let userID = req.userID
	try {
		const { courseid } = req.body

		// Find the wishlist for the user
		let wishlist = await wishlistModel
			.findOne({ _id: userID })
			.populate('courses.course')

		// If the user has no wishlist, return with a message
		if (!wishlist) {
			return res
				.status(404)
				.json({
					success: false,
					message: 'Wishlist not found for the user',
				})
		}

		const existingCartIndex = wishlist.courses.findIndex((p) =>
			p.course.equals(courseid)
		)

		// If the course is not found in the wishlist, return with a message
		if (existingCartIndex === -1) {
			return res
				.status(404)
				.json({
					success: false,
					message: 'course not found in the wishlist',
				})
		}

		// Remove the course from the wishlist
		wishlist.courses.splice(existingCartIndex, 1)

		await wishlist.save()
		res.status(200).json({
			success: true,
			message: 'course removed from wishlist successfully',
			data: wishlist.courses,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** GET: http://localhost:8080/api/getwishlist
query: {
    "email": "example@gmail.com",
}
*/
export async function getwishlist(req, res) {
	let userID = req.userID
	try {
		// Find the cart document and populate the courses field with course data
		const wishlist = await wishlistModel
			.findOne({ _id: userID })
			.populate({
				path:'courses.course',
				populate:{
					path: 'instructor'
				}
			})

		if (!wishlist) {
			return res
				.status(404)
				.json({ success: false, message: 'wishlist not found' })
		}

		res.status(200).json({ success: true, wishlist: wishlist.courses })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

/** PUT: http://localhost:8080/api/lessoncompleted 
 * @param: {
    "header" : "Bearer <token>"
}
body: {
    "lessonId": "65eee9fa38d32c2479937d44"
    "courseId": "65eee9fa38d32c2479937d44"
}
*/
export async function lessonCompleted(req, res) {
	function getCourseDataBySlug(data, courseid) {
		// Loop through the purchased_courses array
		for (let course of data.purchased_courses) {
			// Check if the course slug matches the one we're looking for
			if (course.course._id.toString() === courseid) {
				// Return the matching course data
				return {
					course: course.course,
					completed_lessons: course.completed_lessons,
				}
			}
		}
		// If no course matches, return null or an appropriate message
		return null
	}

	try {
		const { userID } = req.user
		const { lessonId, courseId } = req.body

		if (!userID || !lessonId || !courseId) {
			return res
				.status(400)
				.json({
					message: 'User ID, lesson ID, and course ID are required',
				})
		}

		const user = await UserModel.findById(userID).populate(
			'purchased_courses.course'
		)

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		let data = getCourseDataBySlug(user, courseId)
		let completed = false
		for (const course of user.purchased_courses) {
			if (
				course.course._id.toString() === courseId &&
				course.completed_lessons.includes(lessonId)
			) {
				completed = true
				break
			}
		}

		if (completed) {
			await user.save()
			return res
				.status(400)
				.json({
					message: 'Lesson already completed for this course',
					data,
				})
		}

		for (const course of user.purchased_courses) {
			if (
				course.course._id.toString() === courseId &&
				!course.completed_lessons.includes(lessonId)
			) {
				course.completed_lessons.push(lessonId)
				break
			}
		}

		await user.save()
		return res
			.status(200)
			.json({
				message:
					'Lesson completed successfully for the specified course',
				data: data,
			})
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

/** PUT: http://localhost:8080/api/assignmentcompleted
 * @param: {
    "header" : "Bearer <token>"
}
body: {
    "lessonId": "65eee9fa38d32c2479937d44"
    "courseId": "65eee9fa38d32c2479937d44"
}
*/
export async function assignmentCompleted(req, res) {
	function getCourseDataBySlug(data, courseid) {
		// Loop through the purchased_courses array
		for (let course of data.purchased_courses) {
			// Check if the course slug matches the one we're looking for
			if (course.course._id.toString() === courseid) {
				// Return the matching course data
				return {
					course: course.course,
					completed_lessons: course.completed_lessons,
				}
			}
		}
		// If no course matches, return null or an appropriate message
		return null
	}

	try {
		const { userID } = req.user
		const { lessonId, courseId } = req.body

		if (!userID || !lessonId || !courseId) {
			return res
				.status(400)
				.json({
					message: 'User ID, lesson ID, and course ID are required',
				})
		}

		const user = await UserModel.findById(userID).populate(
			'purchased_courses.course'
		)

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		let data = getCourseDataBySlug(user, courseId)
		let completed = false
		for (const course of user.purchased_courses) {
			if (
				course.course._id.toString() === courseId &&
				course.completed_assignments.includes(lessonId)
			) {
				completed = true
				break
			}
		}

		if (completed) {
			await user.save()
			return res
				.status(400)
				.json({
					message: 'Assignemnt already completed for this course',
					data,
				})
		}

		for (const course of user.purchased_courses) {
			if (
				course.course._id.toString() === courseId &&
				!course.completed_assignments.includes(lessonId)
			) {
				course.completed_assignments.push(lessonId)
				break
			}
		}

		await user.save()
		return res
			.status(200)
			.json({
				message:
					'Assignemnt completed successfully for the specified course',
				data: data,
			})
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: 'Internal server error' })
	}
}

/** PUT: http://localhost:8080/api/getusercompletedassignemnts/:email */
export async function getUserCompletedAssignments(req, res) {
	let { email } = req.params
	let completedAssignmentsLessonNames = []
	let user = await UserModel.findOne({ email }).populate(
		'purchased_courses.course'
	)

	user.purchased_courses.forEach((course) => {
		course.completed_assignments.forEach((completedAssignment) => {
			course.course.curriculum.forEach((chapter) => {
				// Find the lesson with the matching assignment ID
				const lesson = chapter.lessons.find(
					(lesson) => lesson._id.toString() === completedAssignment.toString()
				)
				if (lesson) {
					completedAssignmentsLessonNames.push({
						chapter_name: chapter.chapter_name, 
						lesson_name:lesson.lesson_name, 
						assignmentUrl:  `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/assignments/${lesson._id}`, 
						iscompleted: true})
				}
			})
		})
	})
	return res.status(200).json({ data: completedAssignmentsLessonNames })
}

/** GET: http://localhost:3000/api/search?title=xyz&category=internship */
export async function courseSearch(req,res) {
	try {
		const { title, category } = req.query;
        
        // Build the search criteria object
        let searchCriteria = {};

        if (title) {
            // Match titles containing the given keyword anywhere in the title (case-insensitive)
            searchCriteria.title = { $regex: new RegExp(title, 'i') };
        }

		if (category) {
            // Add category filter to search criteria
            searchCriteria.courseType = category;
        }
		else{
			searchCriteria.courseType = {$ne : 'internship'}
		}

        const courses = await CoursesModel.find({ display: true }).find(searchCriteria);

        if (courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }

		res.status(200).json({ success: true, courses: courses });
	} catch (error) {
		console.error('Error getting course:', error);
        return res.status(500).send({ success: false, message: 'Error getting course: ' + error.message });
	}
}

/** POST: http://localhost:8080/api/addliveclass
body: {
    "courseId": "React Js",
    "chapterName": "Introduction",
	"liveClass": {
        "topic": "New Live Class",
        "startDate": "2024-06-30T09:00:00Z",
        "endDate": "2024-06-30T10:00:00Z",
        "meetingLink": "https://example.com",
        "duration": 60,
		"isCompleted": true,
    }
}
*/
export async function addLiveClassToChapter(req,res) {
	const { courseId, chapterName, liveClass } = req.body;

	try {
		let course = await CoursesModel.findOne({ courseID: courseId });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let chapter = course.curriculum.find(chap => chap.chapter_name === chapterName);

        if (!chapter) {
            // Create a new chapter if not found
            chapter = {
                chapter_name: chapterName,
                lessons: [],
                project: [],
                liveClasses: [liveClass]
            };
            course.curriculum.push(chapter);
        } else {
            chapter.liveClasses.push(liveClass);
        }

        await course.save();

        res.status(200).json({ message: 'Live class added successfully', course });
	} catch (error) {
		console.error('Error getting course:', error);
        return res.status(500).send({ success: false, message: 'Error getting course: ' + error.message });
	}
}

/** GET: http://localhost:8080/api/completedliveclasses?courseId=xyz */
export async function getCompletedLiveClasses(req, res) {
    const { courseId } = req.query;

    try {
        // Find the course by courseID (string)
        let course = await CoursesModel.findOne({ courseID: courseId });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Extract completed live classes
        let completedLiveClasses = [];

        course.curriculum.forEach(chapter => {
            chapter.liveClasses.forEach(liveClass => {
                if (liveClass.isCompleted) {
                    completedLiveClasses.push({
                        courseID: course.courseID,
                        chapterName: chapter.chapter_name,
                        ...liveClass._doc // Spread liveClass details
                    });
                }
            });
        });

        res.status(200).json({ completedLiveClasses });
    } catch (error) {
        console.error('Error getting completed live classes:', error);
        res.status(500).json({ success: false, message: 'Error getting completed live classes: ' + error.message });
    }
}
