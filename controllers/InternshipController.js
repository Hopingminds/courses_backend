import slugify from "slugify";
import bcrypt from 'bcrypt';
import cartModel from '../model/Cart.model.js'
import WishlistModel from "../model/Wishlist.model.js";
import InternshipModel from "../model/Internship.model.js"
import BatchInternshipModel from "../model/BatchInternship.model.js";
import UserModel from "../model/User.model.js";
import InternshipRecordModel from "../model/InternshipRecord.model.js";
import { sendEmail } from "../services/email.service.js";
import { createGoogleMeet, getMeetRecording } from "../services/googleMeet.service.js";
import { uploadInternshipRecordingToS3 } from "../services/aws.service.js";

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
                regex.test(course.category)
            );
        }

        res.status(200).send({ success: true, courses })
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

		const wishlist = await WishlistModel.findOne({ _id: userID }).populate('courses.course').populate('internships.internship'); 
		if (!wishlist) {
			return res.json({ success: false });
		}

		const internshipExists = wishlist.internships.some(item => item.internship._id.toString() === internshipId);

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

export async function getInstructorsInternship(req, res) {
    try {
        const { instructorID } = req.instructor;
        const courses = await InternshipModel.find({ instructor: instructorID }).populate('instructor');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


function generateUniqueKey() {
    return Math.random().toString(36).substr(2, 10);
}

export async function addClassToInternship(req, res) {
    const { internshipId, batchId, unitName, chapter_name, lesson } = req.body;

    if(!internshipId || !batchId || !unitName || !chapter_name || !lesson){
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let internship = await InternshipModel.findById(internshipId).populate({ path:'instructor', select: 'name email' });

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }
        
        const batch = await BatchInternshipModel.findById(batchId).populate({ path:'users', select: 'name email' });
        if(!batch){
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Find the unit by reference
        let unitIndex = batch.curriculum.findIndex(unit => unit.unitName === unitName);
        if (unitIndex === -1) {
            // Create new unit if not found
            batch.curriculum.push({ unitName, chapters: [] });
            unitIndex = batch.curriculum.length - 1;
        }

        // Get reference to the correct unit
        let unit = batch.curriculum[unitIndex];

        // Find the chapter by reference
        let chapterIndex = unit.chapters.findIndex(chap => chap.chapter_name === chapter_name);
        if (chapterIndex === -1) {
            // Create new chapter if not found
            unit.chapters.push({ chapter_name, lessons: [] });
            chapterIndex = unit.chapters.length - 1;
        }

        // Get reference to the correct chapter
        let chapter = unit.chapters[chapterIndex];

        // Combine provided emails with emails from batch users
        const allAttendeeEmails = [];

        // Add teacher's email (assuming the teacher is linked to the internship)
        if (internship && internship.instructor.email) {
            allAttendeeEmails.push(internship.instructor.email);
        }

        // return;
        if (batch.users && batch.users.length > 0) {
            batch.users.forEach(user => {
                if (user.email) {
                    allAttendeeEmails.push(user.email);
                }
            });
        }

        // Ensure live class details are set correctly
        if (lesson.isLiveClass && lesson.liveClass) {
            const meetDetails = await createGoogleMeet(
                lesson.lesson_name,
                new Date(lesson.liveClass.startDate),
                new Date(lesson.liveClass.endDate),
                allAttendeeEmails,
                internship.instructor.email,
                internship.instructor.name
            );
            
            lesson.liveClass.streamKey = meetDetails.streamKey;
            lesson.liveClass.classUrl = meetDetails.meetingLink;
        }

        // Add the lesson to the chapter
        chapter.lessons.push(lesson);

        // Save the updated batch document
        await batch.save();

        return res.status(200).json({ message: 'Live class added successfully', batch });
    } catch (error) {
        console.error('Error getting course:', error);
        return res.status(500).send({ success: false, message: 'Error getting course: ' + error.message });
    }
}

export async function editClassInInternship(req, res) {
    const { internshipId, batchId, unitId, chapterId, lessonId, lesson } = req.body;

    if(!internshipId || !batchId || !unitId || !chapterId || !lessonId || !lesson){
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let internship = await InternshipModel.findById(internshipId);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const batch = await BatchInternshipModel.findById(batchId);
        if(!batch){
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Find the unit
        let unit = batch.curriculum.find(unit => unit._id.toString() === unitId);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Find the chapter within the unit
        let chapter = unit.chapters.find(chap => chap._id.toString() === chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Find the lesson within the chapter
        let lessonIndex = chapter.lessons.findIndex(les => les._id.toString() === lessonId);
        if (lessonIndex === -1) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Update the lesson
        chapter.lessons[lessonIndex] = { ...chapter.lessons[lessonIndex], ...lesson };

        // Ensure live class details are updated correctly
        if (lesson.isLiveClass && lesson.liveClass) {
            chapter.lessons[lessonIndex].liveClass.streamKey = lesson.liveClass.streamKey || generateUniqueKey();
            chapter.lessons[lessonIndex].liveClass.classUrl = `${process.env.CLIENT_BASE_URL}/Livestreaming?Classcode=${chapter.lessons[lessonIndex].liveClass.streamKey}`;
        }

        await batch.save();

        res.status(200).json({ message: 'Lesson updated successfully', batch });
    } catch (error) {
        console.error('Error updating lesson:', error);
        return res.status(500).send({ success: false, message: 'Error updating lesson: ' + error.message });
    }
}

export async function finishClassInInternship(req, res) {
    try {
        const { internshipId, batchId, unitId, chapterId, lessonId } = req.body;

        if (!internshipId || !batchId || !unitId || !chapterId || !lessonId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let internship = await InternshipModel.findById(internshipId);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const batch = await BatchInternshipModel.findById(batchId);
        if(!batch){
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Find the unit
        let unit = batch.curriculum.find(unit => unit._id.toString() === unitId);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Find the chapter within the unit
        let chapter = unit.chapters.find(chap => chap._id.toString() === chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Find the lesson within the chapter
        let lessonIndex = chapter.lessons.findIndex(les => les._id.toString() === lessonId);
        if (lessonIndex === -1) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Update lesson completion for live or recorded lessons
        if (chapter.lessons[lessonIndex].isLiveClass) {
            chapter.lessons[lessonIndex].liveClass.isCompleted = true;
            await batch.save();

            return res.status(200).json({ 
                success: true, 
                message: 'Class completed successfully',
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Class is not a live class'
            });    
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function allotInternshipToStudents(req, res) {
    try {
        const { students, internshipId, batchId } = req.body;
        if (!students || !internshipId || !batchId) {
            return res.status(400).json({ success: false, message: "Invalid request missing required fields" });
        }

        const batch = await BatchInternshipModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        const internship = await InternshipModel.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' })
        }

        const enrolledStudents = [];

        for (const student of students) {
            // Check if the user already exists
            let user = await UserModel.findOne({ email: student.email });
            let plainPassword = null;
            let isNewUser = false;
            // If user doesn't exist, create a new user
            if (!user) {
                // Generate a random password
                isNewUser = true;
                plainPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(plainPassword, 10);

                user = new UserModel({
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    college: student.college,
                    degree: student.degree,
                    year_of_passing: student.year_of_passing,
                    password: hashedPassword,
                });
                await user.save();
            }

            // Check if the internship is already allotted to the user
            const existingEnrollment = await InternshipRecordModel.findOne({
                userID: user._id,
                internshipID: internshipId,
            });

            if (!existingEnrollment) {
                // Enroll the user in the internship
                const newEnrollment = new InternshipRecordModel({
                    userID: user._id,
                    internshipID: internshipId,
                    enrollmentDate: new Date(),
                    progress: 0,
                    completionStatus: "Not Started",
                });

                const subject = `Welcome to Hoping Minds! - ${internship.title}`;
                const message = `Hey ${user.name}, new internships have been added to your account on <a href="${process.env.CLIENT_BASE_URL}" target="_blank">${process.env.CLIENT_BASE_URL}</a> 
                    ${isNewUser ? `Your Password is: ${plainPassword}` : 'Logging With your existing password'}
                    Click the button below to view the internship.
                    <center>
                        <a href="${`${process.env.CLIENT_BASE_URL}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">View Internship</button></a>
                    </center>`;

                const result = await sendEmail(user.name, user.email, subject, message);
                if (!result.success) {
                    throw new Error('Failed to send email.');
                }

                await newEnrollment.save();
                batch.users.push(user._id);
                user.purchased_internships.push({ internship: internshipId, internshipRocord: newEnrollment._id, BatchId: batchId });
                await user.save();
                await batch.save();

                enrolledStudents.push({ userId: user._id, email: user.email, password: plainPassword });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Internship allotted successfully",
            enrolledStudents,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function getAllottedStudentsForInternship(req, res) {
    try {
        const { internshipId } = req.query;

        // Validate internshipId
        if (!internshipId) {
            return res.status(400).json({ success: false, message: "Internship ID is required" });
        }

        // Find all enrollments for the given internshipId
        const enrollments = await InternshipRecordModel.find({ internshipID: internshipId }).populate("userID", "name email phone");

        if (enrollments.length === 0) {
            return res.status(404).json({ success: false, message: "No students allotted to this Internship" });
        }

        // Extract student details
        const students = enrollments.map((enrollment) => ({
            userId: enrollment.userID._id,
            name: enrollment.userID.name,
            email: enrollment.userID.email,
            phone: enrollment.userID.phone,
            progress: enrollment.progress,
            completionStatus: enrollment.completionStatus,
            enrollmentDate: enrollment.enrollmentDate,
        }));

        return res.status(200).json({ success: true, students });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}

export async function getAllottedStudentsForSingleBatchInternship(req, res) {
    try {
        const { internshipId, batchId } = req.query;

        // Validate internshipId
        if (!internshipId || !batchId) {
            return res.status(400).json({ success: false, message: "Internship ID and Batch ID are required" });
        }

        const batch = await BatchInternshipModel.findById(batchId);
        if(!batch) {
            return res.status(404).json({ success: false, message: "Batch Not Found!" });
        }

        const batchStudents = batch.users.map(user => user.toString());

        console.log(batch.users);
        
        // Find all enrollments for the given internshipId
        const enrollments = await InternshipRecordModel.find({ internshipID: internshipId })
            .populate("userID", "name email phone");

        if (enrollments.length === 0) {
            return res.status(404).json({ success: false, message: "No students allotted to this Internship" });
        }

        // Filter students who are part of batchStudents
        const filteredStudents = enrollments
            .filter(enrollment => batchStudents.includes(enrollment.userID._id.toString()))
            .map(enrollment => ({
                userId: enrollment.userID._id,
                name: enrollment.userID.name,
                email: enrollment.userID.email,
                phone: enrollment.userID.phone,
                progress: enrollment.progress,
                completionStatus: enrollment.completionStatus,
                enrollmentDate: enrollment.enrollmentDate,
            }));

        if (filteredStudents.length === 0) {
            return res.status(404).json({ success: false, message: "No students from this batch allotted to this Internship" });
        }

        return res.status(200).json({ success: true, students: filteredStudents });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}


export async function getStudentDetailsForInternship(req, res) {
    try {
        const { userID, internshipId } = req.query;
        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await  UserModel.findById(userID).populate('purchased_internships.BatchId');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const enrolledInternship = await InternshipRecordModel.findOne({ userID, internshipID: internshipId })
            .populate("userID", "name email phone")
            .populate({
                path: "internshipID",
                populate: {
                    path: "instructor",
                },
            });

        if (!enrolledInternship) {
            return res.status(404).json({ success: false, message: "internships Not found for this user" });
        }
        const { submittedAssignments, viewedLessons, offlineClassAttendance } = enrolledInternship;
        let internship = enrolledInternship.internshipID.toObject(); // Convert Mongoose doc to plain object
        
        const userInternshipData = user.purchased_internships.find(internship => internship.internship.toString() === internshipId)
        const userInternship = userInternshipData.BatchId.toObject();


        // Attach assignment and lesson progress details to each lesson
        userInternship.curriculum = userInternship.curriculum.map(unit => ({
            ...unit,
            chapters: unit.chapters.map(chapter => ({
                ...chapter,
                lessons: chapter.lessons.map(lesson => {
                    const submittedAssignment = submittedAssignments.find(assign =>
                        assign.lessonId.toString() === lesson._id.toString()
                    );

                    const lessonView = viewedLessons.find(viewed =>
                        viewed.lessonID.toString() === lesson._id.toString()
                    );

                    const attendance = internship.internshipCategory === "OfflineInternship"
                        ? offlineClassAttendance.find(attend => attend.lessonId.toString() === lesson._id.toString())
                        : null;

                    return {
                        ...lesson,
                        assignmentReport: {
                            isAssignmentSubmitted: !!submittedAssignment,
                            submittedAssignment: submittedAssignment ? submittedAssignment.fileUrl : null,
                            graded: submittedAssignment ? submittedAssignment.graded : false,
                            grade: {
                                from: submittedAssignment?.grade?.from || null,
                                to: submittedAssignment?.grade?.to || null
                            },
                            feedback: submittedAssignment ? submittedAssignment.feedback : null
                        },
                        lessonProgress: {
                            isViewed: !!lessonView,
                            viewedDuration: lessonView ? lessonView.viewedDuration : 0
                        },
                        offlineClassAttendance: internship.internshipCategory === "OfflineInternship"
                            ? {
                                isPresent: attendance ? attendance.isPresent : false
                            }
                            : undefined
                    };
                })
            }))
        }));

        // Embed modified internship object back into enrolledInternship
        const enrolledInternshipObject = enrolledInternship.toObject();
        enrolledInternshipObject.internshipID.curriculum = userInternship.curriculum;

        return res.status(200).json({
            success: true,
            enrolledInternship: enrolledInternshipObject
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}

export async function updateStudentAttendenceForLesson(req, res) {
    try {
        const { userID } = req.user;
        const { internshipId, lessonID, viewedDuration } = req.body;

        if (!internshipId || !lessonID || viewedDuration == null) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const internship = await InternshipModel.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ success: false, message: "Internship not found" });
        }

        let userInternship = await InternshipRecordModel.findOne({ userID, internshipID: internshipId });
        if (!userInternship) {
            return res.status(404).json({ success: false, message: "User is not enrolled in this internship" });
        }

        const lessonExists = internship.curriculum.some(unit =>
            unit.chapters.some(chapter =>
                chapter.lessons.some(lesson => lesson._id.toString() === lessonID)
            )
        );

        if (!lessonExists) {
            return res.status(404).json({ success: false, message: "Lesson not found in this Internship" });
        }

        const lessonIndex = userInternship.viewedLessons.findIndex(l => l.lessonID.toString() === lessonID);
        if (lessonIndex !== -1) {
            userInternship.viewedLessons[lessonIndex].viewedDuration = viewedDuration;
        } else {
            userInternship.viewedLessons.push({ lessonID, viewedDuration });
        }

        await userInternship.save();

        return res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            userInternship,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}

export async function addLessonAttendance(req, res) {
    try {
        const { internshipId, lessonId, attendance } = req.body;

        if (!internshipId || !lessonId || !attendance || !Array.isArray(attendance)) {
            return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
        }

        const bulkUpdates = attendance.map(({ userId, isPresent }) => ({
            updateOne: {
                filter: { internshipID: internshipId, userID: userId, "offlineClassAttendance.lessonId": lessonId },
                update: {
                    $set: { "offlineClassAttendance.$.isPresent": isPresent }
                }
            }
        }));

        const bulkInserts = attendance.map(({ userId, isPresent }) => ({
            updateOne: {
                filter: { internshipID: internshipId, userID: userId, "offlineClassAttendance.lessonId": { $ne: lessonId } },
                update: {
                    $push: {
                        offlineClassAttendance: { lessonId, isPresent }
                    }
                }
            }
        }));

        const result = await InternshipRecordModel.bulkWrite([...bulkUpdates, ...bulkInserts]);

        // Update `completed_lessons` in UserModel for present users
        const presentUsers = attendance.filter(({ isPresent }) => isPresent).map(({ userId }) => userId);

        await UserModel.updateMany(
            { _id: { $in: presentUsers } },
            { $addToSet: { "purchased_internships.$[].completed_lessons": lessonId } } // Ensures no duplicate lesson IDs
        );

        return res.status(200).json({
            success: true,
            message: "Attendance recorded successfully",
            result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
}

export async function uploadStudentAssignment(req, res) {
    try {
        const { userID } = req.query;

        const { internshipId, lessonId } = req.body;
        if (!lessonId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No Assignment file uploaded!" });
        }

        const userInternship = await InternshipRecordModel.findOne({ userID, internshipID: internshipId }).populate('internshipID');
        if (!userInternship) {
            return res.status(404).json({ success: false, message: "User is not enrolled for the internship" });
        }

        const lessonExists = userInternship.internshipID.curriculum.some(unit =>
            unit.chapters.some(chapter =>
                chapter.lessons.some(lesson => lesson._id.toString() === lessonId)
            )
        );

        if (!lessonExists) {
            return res.status(404).json({ success: false, message: 'Lesson not found' })
        }

        const assignmentExisting = userInternship.submittedAssignments.find(assign => assign.lessonId.toString() === lessonId);
        if (assignmentExisting) {
            return res.status(400).json({ success: false, message: "Assignment already submitted for this lesson" });
        }

        userInternship.submittedAssignments.push({ lessonId, fileUrl: req.file.location });
        await userInternship.save();

        return res.status(200).json({ success: true, message: "Assignment uploaded successfully", userInternship });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}

export async function releaseliveClassrecordingforInternship(req, res) {
    try {
        const { internshipId, batchId, unitId, chapterId, lessonId } = req.body;

        if (!internshipId || !batchId || !unitId || !chapterId || !lessonId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let internship = await InternshipModel.findById(internshipId);

        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        const batch = await BatchInternshipModel.findById(batchId);
        if(!batch){
            return res.status(404).json({ message: 'Batch not found' });
        }

        // Find the unit
        let unit = batch.curriculum.find(unit => unit._id.toString() === unitId);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Find the chapter within the unit
        let chapter = unit.chapters.find(chap => chap._id.toString() === chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        // Find the lesson within the chapter
        let lessonIndex = chapter.lessons.findIndex(les => les._id.toString() === lessonId);
        if (lessonIndex === -1) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Update lesson completion for live or recorded lessons
        if (chapter.lessons[lessonIndex].isLiveClass) {
            if(chapter.lessons[lessonIndex].liveClass.isCompleted !== true) {
                return res.status(400).json({
                    success: false,
                    message: "Lesson not completed yet."
                })
            }

            const recordingFile = await getMeetRecording(chapter.lessons[lessonIndex].liveClass.streamKey);

            if (recordingFile) {
                // Upload to AWS S3 and get URL
                const fileUrl = await uploadInternshipRecordingToS3(recordingFile, chapter.lessons[lessonIndex].liveClass.streamKey, chapter.lessons[lessonIndex].lesson_name, internship.title);

                // Update the database with the S3 URL
                chapter.lessons[lessonIndex].video = fileUrl;
                chapter.lessons[lessonIndex].liveClass.isCompleted = true;
                
                // Save the batch with updated information
                await batch.save();
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'Class completed and recording uploaded successfully',
                    videoUrl: fileUrl
                });
            } else {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Recording file not found or ready yet.'
                });
            }
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Class is not a live class'
            });    
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}