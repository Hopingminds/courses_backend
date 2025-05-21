import mongoose from "mongoose";
import BatchModel from "../model/Batch.model.js";
import BatchInternshipModel from "../model/BatchInternship.model.js";
import CoursesModel from '../model/Courses.model.js'
import InternshipModel from "../model/Internship.model.js";
import UserModel from '../model/User.model.js'
import slugify from "slugify";

function getNextBatchDates(startingDate) {
    let nextDates = [];
    let currentMonth = startingDate.getMonth();
    let currentYear = startingDate.getFullYear();
    let batchDays = [1, 7, 16, 28]; 
    // Loop to get next three upcoming batch dates
    while (nextDates.length < 3) {
        for (let day of batchDays) {
            let potentialDate = new Date(currentYear, currentMonth, day);

            // Only push future dates
            if (potentialDate > startingDate) {
                nextDates.push(potentialDate);
                if (nextDates.length === 3) break;
            }
        }

        // Move to the next month if not enough dates found
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    return nextDates;
}

/** GET: http://localhost:8080/api/getUpcomingBatchesForCourse/:courseId */
export async function getUpcomingBatchesForCourse(req, res) {
    try {
        const { courseId } = req.params; // Get courseId from the request params

        if(!courseId){
            return res.status(400).json({message: "Course ID is required"})
        }

        const course = await CoursesModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        // console.log(course)
        const today = new Date();
        let upcomingDates = [];

        // Get the next 3 available batch dates
        upcomingDates = getNextBatchDates(today);

        // Create and save batches for each of the dates
        let createdBatches = [];

        for (let date of upcomingDates) {
            const batchId = `${course.slug}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            try {
                const existingBatch = await BatchModel.findOne({ batchId });

                if (existingBatch) {
                    let existingBatchData = existingBatch.toObject();
                    delete existingBatchData.users;
                    delete existingBatchData.curriculum;
                    createdBatches.push(existingBatchData);
                    continue;
                }

                const newBatch = new BatchModel({
                    batchId,
                    course: courseId,
                    batchName: `Batch for ${course.title} starting on ${date.toISOString().split('T')[0]}`,
                    startDate: date,
                    endDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                    batchlimit: 50,
                    users: [],
                    curriculum: course.curriculum
                });

                const savedBatch = await newBatch.save();
                let batchData = savedBatch.toObject();
                delete batchData.users;
                delete batchData.curriculum;
                createdBatches.push(batchData);
            } catch (error) {
                if (error.code === 11000 && error.keyPattern && error.keyPattern.batchId) {
                    console.log(`Skipping duplicate batchId: ${batchId}`);
                    continue;
                }
                console.error(`Error creating batch for ${date}:`, error);
            }
        }

        // Return the created batches in response
        return res.status(201).json({
            success: true,
            message: "Batches created successfully",
            batches: createdBatches
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}


/** POST: http://localhost:8080/api/setBatchForStudent
body: {
    "courseId":"668d2683f21c44d7e409bb97",
    "batchId":"66de9706d98ce77a98b08f7d"
}
*/
export async function setBatchForStudent(req, res) {
    try {
        const { userID } = req.user;
        const { batchId, courseId } = req.body;

        const student = await UserModel.findById(userID);
        if (!student) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        // Step 2: Find the batch by the provided batchId
        const batch = await BatchModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Step 3: Check if the student has the course in their purchased_courses
        let courseIndex = student.purchased_courses.findIndex(pc => pc.course.toString() === courseId);

        if (courseIndex !== -1) {
            // Step 4: Check if the BatchId is already added for this course
            if (!student.purchased_courses[courseIndex].BatchId) {
                // Add the BatchId and courseStartDate to the purchased course entry
                student.purchased_courses[courseIndex].BatchId = batchId;
                student.purchased_courses[courseIndex].courseStartDate = batch.startDate;

                await student.save();
            } else {
                return res.status(400).send({ success: false, message: 'Student is already enrolled in this batch for the course' });
            }
        } else {
            return res.status(400).send({ success: false, message: 'Student has not purchased this course' });
        }

        // Step 5: Add the student to the batch's users array (if not already added)
        if (!batch.users.includes(userID)) {
            batch.users.push(userID);
            await batch.save();
        }

        return res.status(200).send({ success: true, message: 'Student successfully enrolled in the batch' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getAllBatchesForCourse/:courseId */
export async function getAllBatchesForCourse(req, res) {
    try {
        const { courseId } = req.params;
        const batch = await BatchModel.find({ course: courseId }).populate('users');
        return res.status(200).send(batch);
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/editBatchDetails
body: {
    "BatchId": "66def60d79ba5258ad065c90",
    "batchName": "668d2683f21c44d7e409bb97",
    "startDate": "date",
    "endDate": "date",
    "batchlimit": "23",
}
*/
export async function editBatchDetails(req, res) {
    try {
        const { batchId, batchName, startDate, endDate, batchlimit } = req.body; // Get new details from request body

        // Check if batchId is provided
        if (!batchId) {
            return res.status(400).send({ success: false, message: 'Batch ID is required' });
        }

        // Find the batch by batchId
        const batch = await BatchModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Update the batch details if provided
        if (batchName) {
            batch.batchName = batchName;
        }

        if (startDate) {
            batch.startDate = new Date(startDate);
        }

        if (endDate) {
            if (new Date(endDate) <= batch.startDate) {
                return res.status(400).send({ success: false, message: 'End date must be after start date' });
            }
            batch.endDate = new Date(endDate);
        }

        if (batchlimit) {
            batch.batchlimit = batchlimit;
        }

        await batch.save();

        return res.status(200).send({ success: true, message: 'Batch details updated successfully', batch });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/editBatchCurriculum/:batchId
body: {
    "curriculum"
}
*/
export async function editBatchCurriculum(req, res) {
    try {
        const { batchId } = req.params; // Get batchId from request params
        const { curriculum } = req.body; // Get curriculum details from request body

        // Check if batchId and curriculum are provided
        if (!batchId || !curriculum || !Array.isArray(curriculum)) {
            return res.status(400).send({ success: false, message: 'Batch ID and valid curriculum details are required' });
        }

        // Find the batch by batchId
        const batch = await BatchModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Update the curriculum
        const updatedCurriculum = curriculum.map((chapter) => {
            const updatedChapter = { ...chapter };

            // Ensure lessons, project, and liveClasses have unique IDs
            if (Array.isArray(chapter.lessons)) {
                updatedChapter.lessons = chapter.lessons.map((lesson) => ({
                    ...lesson,
                    _id: lesson._id || new mongoose.Types.ObjectId(),
                }));
            }

            if (Array.isArray(chapter.project)) {
                updatedChapter.project = chapter.project.map((project) => ({
                    ...project,
                    _id: project._id || new mongoose.Types.ObjectId(),
                }));
            }

            if (Array.isArray(chapter.liveClasses)) {
                updatedChapter.liveClasses = chapter.liveClasses.map((liveClass) => ({
                    ...liveClass,
                    _id: liveClass._id || new mongoose.Types.ObjectId(),
                }));
            }

            return updatedChapter;
        });

        // Update the batch document
        await BatchModel.updateOne({ _id: batchId }, { $set: { curriculum: updatedCurriculum } }).exec();

        return res.status(200).send({ success: true, message: 'Curriculum updated successfully' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error: ' + error.message });
    }
}


/** POST: http://localhost:8080/api/addUserToBatch
body: {
    "userID": "66dbe1f2bf4cf6ab57dff5f7",
    "BatchId": "66def60d79ba5258ad065c90",
    "courseId": "668d2683f21c44d7e409bb97"
}
*/
export async function addUserToBatch(req, res) {
    try {
        const { userID, BatchId, courseId } = req.body;

        if (!userID || !BatchId || !courseId) {
            return res.status(404).send({ success: false, message: 'userID, BatchId or courseId not found' });
        }

        const batch = await BatchModel.findById(BatchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found'});
        }

        const student = await UserModel.findById(userID);
        if (!student) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        let courseIndex = student.purchased_courses.findIndex(pc => pc.course.toString() === courseId);
        if (courseIndex === -1) {
            return res.status(400).send({ success: false, message: 'Student has not purchased this course' });
        }

        // Check if the BatchId is already added for this course
        if (!student.purchased_courses[courseIndex].BatchId) {
            // Add the BatchId and courseStartDate to the purchased course entry
            student.purchased_courses[courseIndex].BatchId = BatchId;
            student.purchased_courses[courseIndex].courseStartDate = batch.startDate;

            await student.save();
        } else {
            return res.status(400).send({ success: false, message: 'Student is already enrolled in this batch for the course' });
        }

        if (batch.users.includes(userID)) {
            return res.status(400).send({ success: false, message: 'User is already enrolled'});
        }

        batch.users.push(userID);
        await batch.save();

        return res.status(200).send({ success: true, message: 'Student enrolled in the batch' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/removeUserFromBatch
body: {
    "userID": "66dbe1f2bf4cf6ab57dff5f7",
    "BatchId": "66def60d79ba5258ad065c90",
    "courseId": "668d2683f21c44d7e409bb97"
}
*/
export async function removeUserFromBatch(req, res) {
    try {
        const { userID, BatchId, courseId } = req.body;

        if (!userID || !BatchId || !courseId) {
            return res.status(404).send({ success: false, message: 'userID, BatchId or courseId not found' });
        }

        // Find the batch by BatchId
        const batch = await BatchModel.findById(BatchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Find the user by userID
        const student = await UserModel.findById(userID);
        if (!student) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        // Check if the user is enrolled in the batch
        if (!batch.users.includes(userID)) {
            return res.status(400).send({ success: false, message: 'User is not enrolled in this batch' });
        }

        // Remove the user from the batch's users array
        batch.users = batch.users.filter(user => user.toString() !== userID);
        await batch.save();

        // Update the user's purchased_courses
        let courseIndex = student.purchased_courses.findIndex(pc => pc.course.toString() === courseId);

        console.log(student.purchased_courses[courseIndex])

        if (courseIndex === -1) {
            return res.status(400).send({ success: false, message: 'Student has not purchased this course' });
        }

        if (student.purchased_courses[courseIndex].BatchId && student.purchased_courses[courseIndex].BatchId.toString() === BatchId) {
            // Remove the BatchId and courseStartDate from the purchased course entry
            student.purchased_courses[courseIndex].BatchId = null; // or undefined
            student.purchased_courses[courseIndex].courseStartDate = null; // or undefined
            await student.save();
        } else {
            return res.status(400).send({ success: false, message: 'User is not enrolled in this batch for the course' });
        }

        return res.status(200).send({ success: true, message: 'Student successfully removed from the batch' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}


/** GET: http://localhost:8080/api/getBatch/:batchId */
export async function getBatch(req, res) {
    try {
        const { batchId } = req.params;
        const batch = await BatchModel.findById(batchId).populate({ path:'course', select: '-curriculum' });
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found'});
        }
        return res.status(200).send({ success: true, batch });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getAllCourseUsers/:courseId */
export async function getAllCourseUsers(req, res) {
	const { courseId } = req.params;  // Get courseId from the request parameters

    try {
        // Find users who have purchased the course with the given courseId
        const users = await UserModel.find({
            'purchased_courses.course': courseId  // Filter users by courseId in purchased_courses
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found for this course' });
        }

        res.status(200).json({ success: true, users });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** PUT: http://localhost:8080/api/setCourseCurriculumForAllBatches
body: {
    "courseId": "668d2683f21c44d7e409bb97"
}
*/
export async function setCourseCurriculumForAllBatches(req, res) {
    try {
        const { courseId } = req.body;

        if(!courseId){
            return res.status(400).send({ success: false, message: 'Course ID is required' });
        }

        const course = await CoursesModel.findById(courseId);
        if(!course){
            return res.status(404).send({ success: false, message: 'course for the given id not found' });
        }

        const batches = await BatchModel.find({ course: courseId });
        if (!batches || batches.length === 0) {
            return res.status(404).send({ success: false, message: 'No batches found for this course' });
        }
        
        const courseCurriculum = course.curriculum;
        await Promise.all(
            batches.map(async (batch) => {
                batch.curriculum = courseCurriculum;
                await batch.save();
            })
        );

        return res.status(201).json({ success: true, message: 'Curriculum for all batches is synchronized with the course curriculum.'})
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/************************************************************ INTERNSHIP ****************************************************/

/** GET: http://localhost:8080/api/getUpcomingBatchesForInternship/:internshipId */
export async function getUpcomingBatchesForInternship(req, res) {
    try {
        const { internshipId } = req.params;

        if(!internshipId){
            return res.status(400).json({message: "Internship ID is required"})
        }

        const internship = await InternshipModel.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

        const today = new Date();
        let upcomingDates = [];

        // Get the next 3 available batch dates
        upcomingDates = getNextBatchDates(today);

        // Create and save batches for each of the dates
        let createdBatches = [];

        for (let date of upcomingDates) {
            const batchId = `${internship.slug}-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

            try {
                const existingBatch = await BatchInternshipModel.findOne({ batchId });

                if (existingBatch) {
                    let existingBatchData = existingBatch.toObject();
                    delete existingBatchData.users;
                    delete existingBatchData.curriculum;
                    createdBatches.push(existingBatchData);
                    continue;
                }

                const newBatch = new BatchInternshipModel({
                    batchId,
                    internship: internshipId,
                    batchName: `Batch for ${internship.title} starting on ${date.toISOString().split('T')[0]}`,
                    startDate: date,
                    endDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                    batchlimit: 50,
                    users: [],
                    curriculum: internship.curriculum
                });

                const savedBatch = await newBatch.save();
                let batchData = savedBatch.toObject();
                console.log(batchData)
                delete batchData.users;
                delete batchData.curriculum;
                createdBatches.push(batchData);
            } catch (error) {
                if (error.code === 11000 && error.keyPattern && error.keyPattern.batchId) {
                    console.log(`Skipping duplicate batchId: ${batchId}`);
                    continue;
                }
                console.error(`Error creating batch for ${date}:`, error);
            }
        }

        // Return the created batches in response
        return res.status(201).json({
            success: true,
            message: "Batches created successfully",
            batches: createdBatches
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function createBatchForInternship(req, res) {
    try {
        const { internshipId, batchName, startDate, batchLimit } = req.body;

        if (!internshipId || !batchName || !startDate || !batchLimit) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const internship = await InternshipModel.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

        const start = new Date(startDate);
        const endDate = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days duration
        const batchFinalName = slugify(batchName);

        const batchId = `${batchFinalName}-${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;

        const existingBatch = await BatchInternshipModel.findOne({ batchId });
        if (existingBatch) {
            return res.status(400).json({ message: "Batch already exists for this date" });
        }

        const newBatch = new BatchInternshipModel({
            batchId,
            internship: internshipId,
            batchName,
            startDate: start,
            endDate,
            batchlimit: batchLimit,
            users: [],
            curriculum: internship.curriculum
        });

        const savedBatch = await newBatch.save();

        return res.status(201).json({
            success: true,
            message: "Batch created successfully",
            batch: savedBatch
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
    }
}

/** POST: http://localhost:8080/api/setInternshipBatchForStudent
body: {
    "internshipId":"668d2683f21c44d7e409bb97",
    "batchId":"66de9706d98ce77a98b08f7d"
}
*/
export async function setInternshipBatchForStudent(req, res) {
    try {
        const { userID } = req.user;
        const { batchId, internshipId } = req.body;

        const student = await UserModel.findById(userID);
        if (!student) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        // Step 2: Find the batch by the provided batchId
        const batch = await BatchInternshipModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Step 3: Check if the student has the course in their purchased_courses
        let internshipIndex = student.purchased_internships.findIndex(pi => pi.internship.toString() === internshipId);

        if (internshipIndex !== -1) {
            // Step 4: Check if the BatchId is already added for this course
            if (!student.purchased_internships[internshipIndex].BatchId) {
                // Add the BatchId and courseStartDate to the purchased course entry
                student.purchased_internships[internshipIndex].BatchId = batchId;
                student.purchased_internships[internshipIndex].internshipStartDate = batch.startDate;

                await student.save();
            } else {
                return res.status(400).send({ success: false, message: 'Student is already enrolled in this batch for the course' });
            }
        } else {
            return res.status(400).send({ success: false, message: 'Student has not purchased this course' });
        }

        // Step 5: Add the student to the batch's users array (if not already added)
        if (!batch.users.includes(userID)) {
            batch.users.push(userID);
            await batch.save();
        }

        return res.status(200).send({ success: true, message: 'Student successfully enrolled in the batch' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getAllBatchesForInternship/:internshipId */
export async function getAllBatchesForInternship(req, res) {
    try {
        const { internshipId } = req.params;
        const batch = await BatchInternshipModel.find({ internship: internshipId }).populate('users').populate({ path:'internship', select:'-curriculum'});
        if(!batch){
            return res.status(404).send({ success: false, message: 'No Batch exist for this course'})
        }
        return res.status(200).send(batch);
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/editBatchDetails
body: {
    "BatchId": "66def60d79ba5258ad065c90",
    "batchName": "668d2683f21c44d7e409bb97",
    "startDate": "date",
    "endDate": "date",
    "batchlimit": "23",
}
*/
export async function editBatchInternshipDetails(req, res) {
    try {
        const { batchId, batchName, startDate, endDate, batchlimit } = req.body; // Get new details from request body

        // Check if batchId is provided
        if (!batchId) {
            return res.status(400).send({ success: false, message: 'Batch ID is required' });
        }

        // Find the batch by batchId
        const batch = await BatchInternshipModel.findById(batchId);
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found' });
        }

        // Update the batch details if provided
        if (batchName) {
            batch.batchName = batchName;
        }

        if (startDate) {
            batch.startDate = new Date(startDate);
        }

        if (endDate) {
            if (new Date(endDate) <= batch.startDate) {
                return res.status(400).send({ success: false, message: 'End date must be after start date' });
            }
            batch.endDate = new Date(endDate);
        }

        if (batchlimit) {
            batch.batchlimit = batchlimit;
        }

        await batch.save();

        return res.status(200).send({ success: true, message: 'Batch details updated successfully', batch });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function getBatchForInternship(req, res) {
    try {
        const { batchId } = req.params;
        const batch = await BatchInternshipModel.findById(batchId).populate({ path:'internship', select: '-curriculum' });
        if (!batch) {
            return res.status(404).send({ success: false, message: 'Batch not found'});
        }
        return res.status(200).send({ success: true, batch });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}