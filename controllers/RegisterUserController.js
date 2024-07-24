import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import RegisterUsersModel from '../model/RegisterUsers.model.js';
import { registerMail } from './mailer.js';
import CoursesModel from '../model/Courses.model.js';
import CoursesForDegreeModel from '../model/CoursesForDegree.model.js';

export async function registerUserforHm(req, res){
    try {
        const { email, phone, name, college, degree, courseId } = req.body;

        // Check if email already exists
        const existingRegisterUser = await RegisterUsersModel.findOne({ email });
        if (existingRegisterUser) {
            return res.status(400).send({ success: false, message: 'Email already in use', emailExists: true });
        }

        const existingRegisterUserPhone = await RegisterUsersModel.findOne({ phone });
        if (existingRegisterUserPhone) {
            return res.status(400).send({ success: false, message: 'Phone already in use', phoneExists: true });
        }

        // Check if seats are available for the course
        const courseForDegree = await CoursesForDegreeModel.findOne({ course: courseId });
        if (!courseForDegree || courseForDegree.seats <= 0) {
            return res.status(400).send({ success: false, message: 'No seats available for this course', noSeats: true });
        }
        
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ success: false, message: 'Email already in use in Hoping Minds', registerdinHM: true });
        }

        const generatedPassword = Math.random().toString(36).slice(-8); 
        
        console.log(generatedPassword);

        const hashedPassword = await bcrypt.hash(generatedPassword, 10);
        
        const user = new UserModel({
            email,
            password: hashedPassword,
            name,
            phone,
            college,
            degree,
        })
        

        const newUser = new RegisterUsersModel({
            email,
            phone,
            name,
            college,
            degree,
            course: courseId
        });

        const course = await CoursesModel.findById(courseId);

        let mailSent = false;

        // Assuming registerMail function sends the email asynchronously
        await registerMail({
            body: {
                username: name,
                userEmail: email,
                subject: `Congratulations! You're One Step Closer to Assured Placement in ${course.title}`,
                text: `Dear ${name},</br></br>
                    I hope this message finds you well! I'm thrilled to see your interest in our ${course.title} course. By taking this step, you're not only investing in your education but also moving closer to assured placement opportunities.</br></br>
                    To help you get started, please find below the link to our course site where you can explore more details about the curriculum, instructors, and the benefits of joining our program:</br></br>
                    https://hopingminds.com/detailcourse/${course.slug}</br></br>
                    Login with:</br></br>
                    Email: ${email}</br></br>
                    Password: ${generatedPassword}</br></br>
                    Feel free to explore the information available, and if you have any questions or need further assistance, please don't hesitate to reach out. We're here to support you every step of the way.</br></br>
                    Congratulations again on taking this important step towards your future success in ${course.title}. We look forward to welcoming you to our community and helping you achieve your career goals.</br></br>
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

            await CoursesForDegreeModel.findOneAndUpdate(
                { course: courseId },
                { $inc: { seats: -1 } }
            );

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