import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import RegisterUsersModel from '../model/RegisterUsers.model.js';
import { registerMail } from './mailer.js';
import CoursesModel from '../model/Courses.model.js';
import CoursesForDegreeModel from '../model/CoursesForDegree.model.js';
import CourseByCategoriesModel from '../model/CourseByCategories.model.js';
import CartModel from '../model/Cart.model.js';

export async function addCoursesToCart(userID, courses) {
    try {
        // Find the cart for the user
        let cart = await CartModel.findOne({ _id: userID }).populate('courses.course');

        // If the user has no cart, create a new one
        if (!cart) {
            cart = new CartModel({ _id: userID, courses: [] });
        }

        // Add each course from the category to the user's cart
        for (const course of courses) {
            const existingCartIndex = cart.courses.findIndex((p) =>
                p.course.equals(course._id)
            );
            if (existingCartIndex === -1) {
                cart.courses.push({ course: course._id });
            }
        }

        await cart.save();

        return { success: true, cart };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to update cart');
    }
};

/** POST: http://localhost:8080/api/registeruserform 
* @body : {
    "email": "karyalanshul@gmail.com",
    "phone": 8765433234,
    "name": "Anshul",
    "college": "CU",
    "degree": "B.Tech",
    "stream": "CSE",
    "yearOfPassing": 2025,
    "chosenCategory": "66a9e6f5143fe1de2f92415c"
}
*/
export async function registerUserforHm(req, res){
    try {
        const { email, phone, name, college, degree, stream, yearOfPassing, chosenCategory } = req.body;

        // Check seat availability for each course category
        const courseCategory = await CourseByCategoriesModel.findById(chosenCategory).populate('courses.course'); // Populate courses to get course details

        if (courseCategory) {
            // Check if there are available seats
            if (courseCategory.seats <= 0) {
                return res.status(400).json({ error: `No seats available for category: ${chosenCategory}` });
            }
        } else {
            return res.status(404).json({ error: `Category not found: ${chosenCategory}` });
        }

        // Check if email already exists
        const existingRegisterUser = await RegisterUsersModel.findOne({ email });
        if (existingRegisterUser) {
            return res.status(400).send({ success: false, message: 'Email already in use', emailExists: true });
        }

        const existingRegisterUserPhone = await RegisterUsersModel.findOne({ phone });
        if (existingRegisterUserPhone) {
            return res.status(400).send({ success: false, message: 'Phone already in use', phoneExists: true });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ success: false, message: 'Email already in use in Hoping Minds', registerdinHM: true });
        }

        const generatedPassword = Math.random().toString(36).slice(-8); 
        

        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        
        const user = new UserModel({
            email,
            password: hashedPassword,
            name,
            phone,
            college,
            degree,
            stream,
            yearofpass: yearOfPassing
        })
        

        const newUser = new RegisterUsersModel({
            email,
            phone,
            name,
            college,
            degree,
            stream,
            yearOfPassing,
            chosenCategory,
        });

        let mailSent = false;
        // Assuming registerMail function sends the email asynchronously
        await registerMail({
            body: {
                username: name,
                userEmail: email,
                subject: `Congratulations! You're One Step Closer to Assured Placement in {course.title}`,
                text: `Dear ${name},</br></br>
                    I hope this message finds you well! I'm thrilled to see your interest in our {course.title} course. By taking this step, you're not only investing in your education but also moving closer to assured placement opportunities.</br></br>
                    To help you get started, please find below the link to our course site where you can explore more details about the curriculum, instructors, and the benefits of joining our program:</br></br>
                    https://hopingminds.com/detailcourse/{course.slug}</br></br>
                    Login with:</br></br>
                    Email: ${email}</br></br>
                    Password: ${generatedPassword}</br></br>
                    Feel free to explore the information available, and if you have any questions or need further assistance, please don't hesitate to reach out. We're here to support you every step of the way.</br></br>
                    Congratulations again on taking this important step towards your future success in {course.title}. We look forward to welcoming you to our community and helping you achieve your career goals.</br></br>
                    Best regards,</br></br>
                    Hoping Minds</br>
                    support@hopingminds.com</br>
                    9193700050, 9193100050`,
            },
        }, {
            status(status) {
                if (status === 200) {
                    mailSent = true;
                } else {
                    mailSent = false;
                }
            },
        });

        if (mailSent) {
            const savedUser = await newUser.save();
            
            await user.save();
            const savedUserId = await user._id;

            // Decrease the number of seats for the course category
            courseCategory.seats -= 1;
            await courseCategory.save();

            // Add all courses from the chosen category to the user's cart
            await addCoursesToCart(savedUserId, courseCategory.courses);

            return res.status(201).send({ success: true, message: 'User registered successfully', data: savedUser });
        } else {
            return res.status(500).send({ success: false, message: 'Failed to send registration email' });
        }
        
    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}

export async function getCoursesforDegree(req, res) {
    const { degree } = req.query; // Assuming degree is sent as a query parameter

    try {
        if (!degree) {
            return res.status(400).json({ success: false, message: 'Degree query parameter is required' });
        }

        // Find courses associated with the given degree
        const coursesForDegree = await CoursesForDegreeModel.find({ degrees: degree }).populate('course');

        // Check if any courses are found
        if (coursesForDegree.length === 0) {
            return res.status(404).json({ success: false, message: 'No courses found for the given degree' });
        }

        // Respond with the found courses
        res.status(200).json({ success: true, data: coursesForDegree });
    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}

export const addCoursesForDegrees = async (req, res) => {
    const { degrees, courseId, seats, packages } = req.body; // Assuming you receive degrees (array), courseId, seats, and package from the request body

    try {
        // Check if the course exists
        const course = await CoursesModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Create a new CoursesForDegree document
        const newCoursesForDegree = new CoursesForDegreeModel({
            degrees, // Assuming degrees is an array of strings
            course: courseId,
            seats,
            packages
        });

        // Save the new CoursesForDegree document
        await newCoursesForDegree.save();

        // Respond with the created CoursesForDegree document
        res.status(201).json(newCoursesForDegree);

    } catch (error) {
        // Handle any errors
        console.error("Error adding courses for degrees:", error);
        res.status(500).json({ message: "Failed to add courses for degrees" });
    }
};

export async function validateUser(req, res){
    try {
        const { email, phone } = req.query;

        // Check if email already exists
        const existingRegisterUser = await RegisterUsersModel.findOne({ email });
        if (existingRegisterUser) {
            return res.status(400).send({ success: false, message: 'Email already in use', emailExists: true });
        }

        const existingRegisterUserPhone = await RegisterUsersModel.findOne({ phone });
        if (existingRegisterUserPhone) {
            return res.status(400).send({ success: false, message: 'Phone already in use', phoneExists: true });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ success: false, message: 'Email already in use in Hoping Minds', registerdEmailinHM: true });
        }

        const existingUserPhone = await UserModel.findOne({ phone });
        if (existingUserPhone) {
            return res.status(400).send({ success: false, message: 'Phone already in use in Hoping Minds', registerdPhoneinHM: true });
        }

        return res.status(200).send({ success: true, message: 'Continue registration' });
    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}

/** POST: http://localhost:8080/api/createcoursesbycategorie 
* @body : {
    "categoryName": "Web Development",
    "courses": [
        {
            "course": "66a9e56261cf3aa508ce8e6e"
        },
    ],
    "packages": {
        "from": 12,
        "to": 24
    },
    "whatWillYouLearn": [
        "whatWillYouLearn1",
        "whatWillYouLearn2",
        "whatWillYouLearn3"
    ],
    "companies": [
        "companies1",
        "companies2"
    ],
    "seats": 23
}
*/
export async function createCoursesByCategorie(req, res){
    try {
        const categoryData = req.body;

        let course = new CourseByCategoriesModel(categoryData);
        await course.save();

        res.status(201).json({
			success: true,
			msg: 'Course added successfully for category',
		})
    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}

/** GET: http://localhost:8080/api/getcoursesbycategorie */
export async function getCoursesByCategorie(req, res){
    try {
        const data = await CourseByCategoriesModel.find().populate({path:'courses.course', select:'-curriculum'});
        res.status(200).json({
            success: true,
            msg: 'Courses by category',
            data: data
        });

    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}

/** PUT: https://localhost:8080/api/updatecourse
@body : {
    "_id": "66a9e56261cf3aa508ce8e6e",
    "categoryName": "Web Development",
    "courses": [
        {
            "course": "66a9e56261cf3aa508ce8e6e"
        },
    ],
    "packages": {
        "from": 12,
        "to": 24
    },
    "whatWillYouLearn": [
        "whatWillYouLearn1",
        "whatWillYouLearn2",
        "whatWillYouLearn3"
    ],
    "companies": [
        "companies1",
        "companies2"
    ],
    "seats": 23
}
 */
export async function editCoursesByCategorie(req, res){
    const { _id, ...updates } = req.body;
    try {
        // Ensure id is provided
        if (!_id) {
            return res.status(400).json({ 
                message: 'Category ID is required', 
                success: false 
            });
        }
        
        // Update the category by ID with the provided data
        const updatedCategory = await CourseByCategoriesModel.findByIdAndUpdate(
            _id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({
                message: 'Category not found',
                success: false
            });
        }

        return res.status(200).json({ 
            message: 'Category Updated Successfully!', 
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        return res.status(501).send({ success: false, message:'Internal Server Error', error })
    }
}