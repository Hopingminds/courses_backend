import slugify from "slugify";
import cartModel from '../model/Cart.model.js'
import WishlistModel from "../model/Wishlist.model.js";
import InternshipModel from "../model/Internship.model.js"
import BatchInternshipModel from "../model/BatchInternship.model.js";
import UserModel from "../model/User.model.js";

/** POST: http://localhost:8080/api/addInternship
* @body : {
    dummy.json
}
*/
export async function addInternship(req, res) {
    try {
        const internshipData = req.body;

        internshipData.slug = slugify(internshipData.title);
        let internship = new InternshipModel(internshipData);

        await internship.save();
        return res.status(201).json({ success: true, message: 'Internship added successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getAllInternships */
export const getAllInternships = async (req, res) => {
    try {
        const courses = await InternshipModel.find();
        return res.status(200).json({ success: true, courses });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getInternships */
export async function getInternships(req, res) {
    try {
        let {
            category,
            sort,
            price_min,
            price_max,
            search,
            credits
        } = req.query;

        let query = { display: { $ne: false } }; // Ensure only displayed courses are fetched

        // Add category and subcategory to the query if provided
        if (category) {
            query.category = category
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

        // Build the sort object based on the 'sort' parameter
        let sortObj = { display: -1 }; // Default sorting by display status
        if (sort === 'price_asc') {
            sortObj.base_price = 1
        } else if (sort === 'price_desc') {
            sortObj.base_price = -1
        }

        // Query the database with the search criteria
        let courses = await InternshipModel.find(query).sort(sortObj).lean();

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
                let { instructor, ...rest } = course
                let { password, token, ...insRest } = instructor
                return { ...rest, instructor: insRest }
            }
            return course;
        });

        res.status(200).send({ success: true, courses: filterData })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/updateInternship
* @body : {
    dummy.json
}
*/
export async function updateInternship(req, res) {
    const body = req.body
    try {
        const internship = await InternshipModel.findByIdAndUpdate(body._id, body, { new: true })
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }
        return res.status(200).json({ success: true, internship })

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** DELETE: http://localhost:8080/api/deleteInternship
    body {
        "internshipId": "7gh8h76fgbn767gh7yug67yuy7t67"
    }
*/
export async function deleteInternship(req, res) {
    try {
        const { internshipId } = req.body;
        const result = await InternshipModel.deleteOne({ _id: internshipId });

        if (result.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'Internship deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: 'No Internship found for the given Internship ID.' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getInternshipBySlug/:internshipName */
export async function getInternshipBySlug(req, res){
    try {
        const { internshipName } = req.params;
        const internship = await InternshipModel.findOne({ slug: internshipName })

        if (!internship) {
			return res.status(404).json({ success: false, message: 'Internship not found' })
		}

        return res.status(200).json({ success: true, internship });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/isInternshipInCart/:internshipId */
export async function isInternshipInCart(req, res) {
	try {
		const { internshipId } = req.params;
		const { userID } = req.user;

		const cart = await cartModel.findOne({ _id: userID }).populate('courses.course').populate('internships.internship'); 
		
		if (!cart) {
			return res.json({ success: false });
		}

		const internshipExists = cart.internships.some(item => item.internship._id.toString() === internshipId);

		if (internshipExists) {
			return res.json({ success: true, message: 'Internship exists in the cart' });
		} else {
			return res.json({ success: false, message: 'Internship does not exist in the cart' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** GET: http://localhost:8080/api/isInternshipInWishlist/:internshipId */
export async function isInternshipInWishlist(req, res) {
	try {
		const { internshipId } = req.params;
		const { userID } = req.user;

		const wishlist = await WishlistModel.findOne({ _id: userID }).populate('courses.course'); 
		
		if (!wishlist) {
			return res.json({ success: false });
		}

		const internshipExists = wishlist.internships.some(item => item.internships._id.toString() === internshipId);

		if (internshipExists) {
			return res.json({ success: true, message: 'Internship exists in the wishlist' });
		} else {
			return res.json({ success: false, message: 'Internship does not exist in the wishlist' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** GET: http://localhost:8080/api/getUserInternshipBySlug/:internshipName */
export async function getUserInternshipBySlug(req, res) {
    try {
        function getInternshipDataBySlug(data, slug) {
            for (let internship of data.purchased_internships) {
                if (internship && internship.internship && internship.internship.slug) {
                    if (internship.internship.slug === slug) {
                        return {
                            internship: internship.internship,
                            completed_lessons: internship.completed_lessons,
                            completed_assignments: internship.completed_assignments,
                            batchId: internship.BatchId  // Add BatchId for batch retrieval
                        };
                    }
                }
            }
            return null;
        }
        const { userID } = req.user;
        const { internshipName } = req.params;

        const user = await UserModel.findById(userID).populate({ path: 'purchased_internships.internship' });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const internshipData = getInternshipDataBySlug(user, internshipName);

        if (!internshipData) {
            return res.status(404).json({ success: false, message: 'internship not found' });
        }

        // Fetch the batch based on the BatchId from the purchased internship
        const batch = await BatchInternshipModel.findById(internshipData.batchId).populate('curriculum');

        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // Replace the course curriculum with the batch curriculum
        internshipData.internship.curriculum = batch.curriculum;

        // Calculate total lessons based on the batch curriculum
        const totalLessons = batch.curriculum.reduce((total, unit) => {
            return total + unit.chapters.reduce((chapterTotal, chapter) => {
                return chapterTotal + chapter.lessons.length;
            }, 0);
        }, 0);        

        res.status(200).json({ success: true, data: internshipData, totalLessons });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

/** PUT: http://localhost:8080/api/internshipLessonCompleted 
 * @param: {
    "header" : "Bearer <token>"
}
@body: {
    "lessonId": "65eee9fa38d32c2479937d44"
    "internshipId": "65eee9fa38d32c2479937d44"
}
*/
export async function internshipLessonCompleted(req, res) {
    try {
        function getInternshipDataBySlug(data, internshipId) {
            // Loop through the purchased_internships array
            for (let internship of data.purchased_internships) {
                // Check if the internship ID matches the one we're looking for
                if (internship.internship._id.toString() === internshipId) {
                    // Return the matching internship data
                    return {
                        internship: internship.internship,
                        completed_lessons: internship.completed_lessons,
                    };
                }
            }
            // If no internship matches, return null or an appropriate message
            return null;
        }
        
        const { userID } = req.user;
        const { lessonId, internshipId } = req.body;

        if (!userID || !lessonId || !internshipId) {
            return res.status(400).json({
                message: 'User ID, lesson ID, and internship ID are required',
            });
        }

        const user = await UserModel.findById(userID).populate('purchased_internships.internship');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let data = getInternshipDataBySlug(user, internshipId);
        if (!data) {
            return res.status(404).json({ message: 'Internship not found for the user' });
        }

        let completed = false;
        for (const internship of user.purchased_internships) {
            if (internship.internship._id.toString() === internshipId && internship.completed_lessons.includes(lessonId)) {
                completed = true;
                break;
            }
        }

        if (completed) {
            return res.status(400).json({ message: 'Lesson already completed for this internship', data });
        }

        for (const internship of user.purchased_internships) {
            if (internship.internship._id.toString() === internshipId && !internship.completed_lessons.includes(lessonId)) {
                internship.completed_lessons.push(lessonId);
                break;
            }
        }

        await user.save();
        return res.status(200).json({ message: 'Lesson completed successfully for the specified internship', data });
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
	}
}