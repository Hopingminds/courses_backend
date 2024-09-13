import slugify from 'slugify'
import cartModel from '../model/Cart.model.js'
import wishlistModel from '../model/Wishlist.model.js'
import CoursesModel from '../model/Courses.model.js'
import UserModel from '../model/User.model.js'
import OrdersModel from '../model/Orders.model.js'
import { populate } from 'dotenv'
import mongoose from "mongoose";
import BatchModel from '../model/Batch.model.js';
import { scheduleAddtoCartMail } from './HelpersController.js'

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
		let query = { display: { $ne: false } }; // Ensure only displayed courses are fetched

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

		// Handle courseType logic
		if (type === 'internship') {
			query.courseType = 'internship'
		} else if (type === 'minorDegree') {
			query.courseType = 'minorDegree'
		} else {
			query.courseType = { $ne: 'internship' }
		}

		// Build the sort object based on the 'sort' parameter
		let sortObj = { display: -1 }; // Default sorting by display status
		if (sort === 'price_asc') {
			sortObj.base_price = 1
		} else if (sort === 'price_desc') {
			sortObj.base_price = -1
		}
		sortObj.courseCategory = -1;

		// Query the database with the search criteria
		let courses = await CoursesModel.find(query)
			.sort(sortObj)
			.populate('instructor')
			.lean();

		// In-memory filtering based on the search field
		if (search) {
			const regex = new RegExp(search, 'i');
			courses = courses.filter(course =>
				regex.test(course.title) ||
				regex.test(course.category) ||
				(course.instructor && regex.test(course.instructor.name))
			);
		}

		// Remove sensitive fields from the instructor object
		let filterData = courses.map(course => {
			if (course.instructor) {
				let {instructor, ...rest} = course
				let {password, token, ...insRest} = instructor
				return {...rest, instructor:insRest}
			}
			return course;
		});

		res.status(200).send({ success: true, courses: filterData })
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

		const totalLessons = course.curriculum.reduce((total, chapter) => {
			return total + chapter.lessons.length;
		}, 0);

		res.status(200).json({ success: true, course:filterData(course), totalLessons })
	} catch (error) {
		console.error(error)
		res.status(500).json({
			success: false,
			message: 'Internal server error',
		})
	}
}

export async function getUserCourseBySlug(req, res) {
    
    try {function getCourseDataBySlug(data, slug) {
        for (let course of data.purchased_courses) {
            if (course && course.course && course.course.slug) {
                if (course.course.slug === slug) {
                    return {
                        course: course.course,
                        completed_lessons: course.completed_lessons,
                        completed_assignments: course.completed_assignments,
                        batchId: course.BatchId  // Add BatchId for batch retrieval
                    };
                }
            }
        }
        return null;
    }

        const { email, coursename } = req.params;

        const user = await UserModel.findOne({ email }).populate({
            path: 'purchased_courses.course',
            populate: { path: 'instructor', select: '-token -password' }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const courseData = getCourseDataBySlug(user, coursename);

        if (!courseData) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Fetch the batch based on the BatchId from the purchased course
        const batch = await BatchModel.findById(courseData.batchId).populate('curriculum');

        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // Replace the course curriculum with the batch curriculum
        courseData.course.curriculum = batch.curriculum;

        // Calculate total lessons based on the batch curriculum
        const totalLessons = batch.curriculum.reduce((total, chapter) => {
            return total + chapter.lessons.length;
        }, 0);

        res.status(200).json({ success: true, data: courseData, totalLessons });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

/** PUT: https://localhost:8080/api/updatecourse */
export async function updateCourse(req, res) {
	const { _id, curriculum, ...rest } = req.body;
    const updateOps = {};

    try {
        // Process curriculum updates
        if (curriculum && Array.isArray(curriculum)) {
            curriculum.forEach((chapter, chapterIndex) => {
                for (const [key, value] of Object.entries(chapter)) {
                    if (key === 'lessons' && Array.isArray(value)) {
                        value.forEach((lesson, lessonIndex) => {
                            if (!lesson._id) lesson._id = new mongoose.Types.ObjectId();
                            for (const [lessonKey, lessonValue] of Object.entries(lesson)) {
                                updateOps[`curriculum.${chapterIndex}.lessons.${lessonIndex}.${lessonKey}`] = lessonValue;
                            }
                        });
                    } else if (key === 'project' && Array.isArray(value)) {
                        value.forEach((project, projectIndex) => {
                            if (!project._id) project._id = new mongoose.Types.ObjectId();
                            for (const [projectKey, projectValue] of Object.entries(project)) {
                                updateOps[`curriculum.${chapterIndex}.project.${projectIndex}.${projectKey}`] = projectValue;
                            }
                        });
                    } else if (key === 'liveClasses' && Array.isArray(value)) {
                        value.forEach((liveClass, liveClassIndex) => {
                            if (!liveClass._id) liveClass._id = new mongoose.Types.ObjectId();
                            for (const [liveClassKey, liveClassValue] of Object.entries(liveClass)) {
                                updateOps[`curriculum.${chapterIndex}.liveClasses.${liveClassIndex}.${liveClassKey}`] = liveClassValue;
                            }
                        });
                    } else {
                        updateOps[`curriculum.${chapterIndex}.${key}`] = value;
                    }
                }
            });
        }

        // Add other fields to updateOps
        for (const [key, value] of Object.entries(rest)) {
            updateOps[key] = value;
        }

        await CoursesModel.updateOne({ _id }, { $set: updateOps }).exec();
        return res.status(200).json({ message: 'Course Updated Successfully!', success: true });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Error getting completed live classes: ' + error.message });
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
		else {
			// Filter out any invalid or missing courses (null courses)
			const validCourses = cart.courses.filter((item) => item.course !== null);
			if (validCourses.length !== cart.courses.length) {
				cart.courses = validCourses;
				await cart.save();  // Save the cleaned cart to the database
			}
		}

		const existingCartIndex = cart.courses.findIndex((p) =>
			p.course.equals(course._id)
		)
		if (existingCartIndex !== -1) {
			return res.status(400).json({
				success: false,
				msg: 'Course already exists in cart',
			});
		}

		cart.courses.push({ course: courseid });

		await cart.save()

		const user = await UserModel.findById(userID)
		let subject = "Congratulations! You're One Step Closer to Assured Placement with Hoping Minds";
		let text = "Your course is waiting"
		 ( user.name, user.email, 20, subject, text, userID, courseid);

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
			message: 'Course removed from cart successfully',
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
	function getCourseDataBySlug(data, courseId) {
        // Loop through the purchased_courses array
        for (let course of data.purchased_courses) {
            // Check if the course ID matches the one we're looking for
            if (course.course._id.toString() === courseId) {
                // Return the matching course data
                return {
                    course: course.course,
                    completed_lessons: course.completed_lessons,
                };
            }
        }
        // If no course matches, return null or an appropriate message
        return null;
    }

    try {
        const { userID } = req.user;
        const { lessonId, courseId } = req.body;

        if (!userID || !lessonId || !courseId) {
            return res.status(400).json({
                message: 'User ID, lesson ID, and course ID are required',
            });
        }

        const user = await UserModel.findById(userID).populate('purchased_courses.course');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let data = getCourseDataBySlug(user, courseId);
        if (!data) {
            return res.status(404).json({ message: 'Course not found for the user' });
        }

        let completed = false;
        for (const course of user.purchased_courses) {
            if (
                course.course._id.toString() === courseId &&
                course.completed_lessons.includes(lessonId)
            ) {
                completed = true;
                break;
            }
        }

        if (completed) {
            return res.status(400).json({
                message: 'Lesson already completed for this course',
                data,
            });
        }

        for (const course of user.purchased_courses) {
            if (
                course.course._id.toString() === courseId &&
                !course.completed_lessons.includes(lessonId)
            ) {
                course.completed_lessons.push(lessonId);
                break;
            }
        }

        await user.save();
        return res.status(200).json({
            message: 'Lesson completed successfully for the specified course',
            data,
        });
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
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
					success: false,
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
					success: false,
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
				success: true,
				message:
					'Assignemnt completed successfully for the specified course',
				data: data,
			})
	} catch (error) {
		console.error(error)
		return res.status(500).json({ success: false, message: 'Internal server error' })
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
						iscompleted: true,
						course: course.course.title
					})
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

        // Build the initial search criteria
        let searchCriteria = { display: true };

        if (category) {
            // Add category filter to search criteria
            searchCriteria.courseType = category;
        } else {
            searchCriteria.courseType = { $ne: 'internship' }; // Exclude 'internship' category if not specified
        }

        // Query the database with the search criteria and populate the instructor field
        let courses = await CoursesModel.find(searchCriteria).populate('instructor');

        if (title) {
            // Create a regex pattern for case-insensitive search
            const regex = new RegExp(title, 'i');

            // Filter the results based on the title, category, and instructor.name fields
            courses = courses.filter(course =>
                regex.test(course.title) ||
                regex.test(course.category) ||
                (course.instructor && regex.test(course.instructor.name))
            );
        }

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

export async function getAllOrders(req, res) {
    try {
        const orders = await OrdersModel.find().populate('purchasedBy','-password -token').populate('courses.course');
        
		if (!orders) {
            return res.status(404).json({ message: 'No orders found' });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export async function getOrderByUser(req, res){
	try {
		const { userID } = req.user;
		const orders = await OrdersModel.find({ purchasedBy: userID }).populate('courses.course');
		
		if (!orders) {
            return res.status(404).json({ message: 'No orders found' });
        }

		res.status(200).json({success: true, data: orders});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Error getting completed live classes: ' + error.message });
	}
}

/** GET: http://localhost:8080/api/iscourseincart/:courseId */
export async function isCourseInCart(req, res) {
	try {
		const { courseId } = req.params;
		const { userID } = req.user;

		const cart = await cartModel.findOne({ _id: userID }).populate('courses.course'); 
		
		if (!cart) {
			return res.json({ success: false });
		}

		const courseExists = cart.courses.some(item => item.course._id.toString() === courseId);

		if (courseExists) {
			return res.json({ success: true, message: 'Course exists in the cart' });
		} else {
			return res.json({ success: false, message: 'Course does not exist in the cart' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** GET: http://localhost:8080/api/iscourseinwishlist/:courseId */
export async function isCourseInWishlist(req, res) {
	try {
		const { courseId } = req.params;
		const { userID } = req.user;

		const wishlist = await wishlistModel.findOne({ _id: userID }).populate('courses.course'); 
		
		if (!wishlist) {
			return res.json({ success: false });
		}

		const courseExists = wishlist.courses.some(item => item.course._id.toString() === courseId);

		if (courseExists) {
			return res.json({ success: true, message: 'Course exists in the wishlist' });
		} else {
			return res.json({ success: false, message: 'Course does not exist in the wishlist' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** GET: http://localhost:8080/api/iscoursecompleted/:courseId
@param: {
    "header" : "Bearer <token>"
}
 */
export async function CompletedCourses(req, res) {
	try {
		const { userID } = req.user;

        // Find the user by userID and populate purchased_courses
        const user = await UserModel.findById(userID).populate({
            path: 'purchased_courses.course',
            populate: { path: 'instructor', select: '-token -password' }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Filter completed courses
        const completedCourses = await Promise.all(user.purchased_courses.map(async (purchasedCourse) => {
            const course = purchasedCourse.course;
            if (!course) return null;

            // Calculate completed lessons for the course by the user
            const completedLessons = purchasedCourse.completed_lessons.length;

            // Calculate total lessons in the course curriculum
            const totalLessons = course.curriculum.reduce((total, chapter) => {
                return total + chapter.lessons.length;
            }, 0);

            const isCompleted = completedLessons >= totalLessons;

            // Return course if completed
            return isCompleted ? course : null;
        }));

        // Filter out null values (non-completed courses)
        const filteredCourses = completedCourses.filter(course => course !== null);

		// Check if there are no completed courses
        if (filteredCourses.length === 0) {
            return res.status(404).json({ success: false, message: 'No course completed' });
        }

        res.status(200).json({ success: true, courses: filteredCourses });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}