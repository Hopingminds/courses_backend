import slugify from "slugify";
import InternshipModel from "../model/Internship.model.js"

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

/** GET: http://localhost:8080/api/iscourseincart/:courseId */
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

/** GET: http://localhost:8080/api/iscourseinwishlist/:courseId */
export async function isCourseInWishlist(req, res) {
	try {
		const { internshipId } = req.params;
		const { userID } = req.user;

		const wishlist = await wishlistModel.findOne({ _id: userID }).populate('courses.course'); 
		
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
