import BatchModel from "../model/Batch.model.js";
import CoursesModel from '../model/Courses.model.js'
import UserModel from '../model/User.model.js'

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
        console.log(course)
        const today = new Date();
        const batchDays = [1, 7, 16, 28];  // Batch start dates
        let upcomingDates = [];

        function getNextBatchDates(startingDate) {
            let nextDates = [];
            let currentMonth = startingDate.getMonth();
            let currentYear = startingDate.getFullYear();

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

        // Get the next 3 available batch dates
        upcomingDates = getNextBatchDates(today);

        // Create and save batches for each of the dates
        let createdBatches = [];

        for (let date of upcomingDates) {
            // Step 1: Check if a batch already exists for this course on this date
            const existingBatch = await BatchModel.findOne({
                course: courseId,
                startDate: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
                }
            });

            if (existingBatch) {
                let batchData = existingBatch.toObject();
                delete batchData.users;
                delete batchData.curriculum;

                createdBatches.push(batchData);
                console.log(`Batch already exists for ${date}`);
                continue;  // Skip creating a new batch if one exists for the same date
            }

            // Step 2: If no existing batch, create a new one
            const newBatch = new BatchModel({
                batchId: `${course.slug}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,  // Unique batchId based on courseId and date
                course: courseId,  // Reference the course
                batchName: `Batch for ${course.title} starting on ${date.toISOString().split('T')[0]}`,  // Batch name based on course and date
                startDate: date,
                endDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),  // Assuming the batch lasts 30 days
                batchlimit: 50,  // Example batch limit, you can modify this
                users: [],  // Initialize with an empty users array
                curriculum: course.curriculum  // Initialize with an empty curriculum, to be filled later
            });

            const savedBatch = await newBatch.save();

            // Remove empty users and curriculum from the saved batch
            let batchData = savedBatch.toObject();
            delete batchData.users;
            delete batchData.curriculum;

            createdBatches.push(batchData);  // Store each created batch
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

export async function getAllBatchesForCourse(req, res) {
    try {
        const { courseId } = req.params;
        const batch = await BatchModel.find({ course: courseId }).populate('users');
        return res.status(200).send(batch);
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal server error' + error.message });
    }
}