import BatchModel from "../model/Batch.model.js";
import CoursesModel from '../model/Courses.model.js'
import UserModel from '../model/User.model.js'

/** POST: http://localhost:8080/api/instlogin 
* @param : {
    "batchId" : "batchId",
    "course" : "courseID",
    "batchName" : "batchName",
    "startDate" : "startDate",
    "endDate" : "endDate",
    "batchDuration" : "batchDuration",
    "users" : "usersID",
}
*/
export async function createBatch(req, res){
    try {
        const { batchId, course, batchName, startDate, endDate, batchDuration, users } = req.body;

        // Check if the provided course ID exists in the database
        const existingCourse = await CoursesModel.findById(course);
        if (!existingCourse) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if all provided user IDs exist in the database
        const existingUsers = await UserModel.find({ '_id': { $in: users } });
        if (existingUsers.length !== users.length) {
            return res.status(404).json({ error: "One or more users not found" });
        }

        // Create a new batch instance
        const newBatch = new BatchModel({
            batchId,
            course,
            batchName,
            startDate,
            endDate,
            batchDuration,
            users,
        });

        // Save the batch to the database
        await newBatch.save();

        res.status(201).json(newBatch);
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}

export async function getBatchesByCourse(req, res){
    try {
        const { courseId } = req.params;

        // Find all batches that reference the given course ID
        const batches = await BatchModel.find({ course: courseId }).populate('course');

        if (batches.length === 0) {
            return res.status(404).json({ message: "No batches found for this course" });
        }

        res.status(200).json(batches);
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}

export async function getBatchesUsers(req, res){
    try {
        const { batchId } = req.params;

        // Find all batches that reference the given course ID
        const batches = await BatchModel.findById({ batchId }).populate('users');

        if (batches.length === 0) {
            return res.status(404).json({ message: "No batches found for this course" });
        }

        res.status(200).json(batches);
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}