import BatchModel from "../model/Batch.model.js";
import CoursesModel from '../model/Courses.model.js'
import UserModel from '../model/User.model.js'

/** POST: http://localhost:8080/api/createbatch 
* @body : {
    "batchId" : "batchId",
    "course" : "courseID",
    "batchName" : "batchName",
    "startDate" : "startDate",
    "endDate" : "endDate",
    "batchDuration" : "batchDuration",
    "users" : ["usersID"],
}
*/
export async function createBatch(req, res){
    try {
        const batchData = req.body;
        // Check if the provided course ID exists in the database
        const existingCourse = await CoursesModel.findById(batchData.course);
        if (!existingCourse) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if all provided user IDs exist in the database
        const existingUsers = await UserModel.find({ '_id': { $in: batchData.users } });
        if (existingUsers.length !== batchData.users.length) {
            return res.status(404).json({ error: "One or more users not found" });
        }

        // Create a new batch instance
        const newBatch = new BatchModel(batchData);

        // Save the batch to the database
        await newBatch.save();

        res.status(201).json(newBatch);
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}

/** GET: http://localhost:8080/api/getcoursebatches/:courseId
* @param: {
    "courseId": "b4y5rbtfnuygh665rbjtyhg",
}
*/
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

/** GET: http://localhost:8080/api/getbatchesusers/:batchId
* @param: {
    "batchId": "b4y5rbtfnuygh665rbjtyhg",
}
*/
export async function getBatchesUsers(req, res){
    try {
        const { batchId } = req.params;

        // Find the batch by its ID and populate the users field
        const batch = await BatchModel.findById(batchId).populate('users');

        if (!batch) {
            return res.status(404).json({ message: "Batch not found" });
        }

        res.status(200).json(batch);
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}

/** PUT: http://localhost:8080/api/updateuserbatch 
 * @param: {
    "header" : "Bearer <instToken>"
}
body: {
	"userId": "4sr43dr43tfd54yrft",
	"newBatchId": "4sr43dr43tfd54yrft"
}
*/
export async function updateUserBatch(req, res){
    try {
        const { userId, newBatchId } = req.body;

        // Check if the provided user ID exists in the database
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the provided new batch ID exists in the database
        const existingNewBatch = await BatchModel.findById(newBatchId);
        if (!existingNewBatch) {
            return res.status(404).json({ error: "Batch not found" });
        }

        // Find the user's current batch for the same course
        const currentBatch = await BatchModel.findOne({ course: existingNewBatch.course, users: userId });

        // If a current batch is found, remove the user from it
        if (currentBatch) {
            currentBatch.users.pull(userId);
            await currentBatch.save();
        }

        // Add the user to the new batch
        existingNewBatch.users.push(userId);
        await existingNewBatch.save();

        // Update the user's batch reference (if applicable, depending on your user schema)
        // existingUser.batch = newBatchId;  // Uncomment this line if you store batch reference in user schema
        // await existingUser.save();  // Uncomment this line if you store batch reference in user schema

        res.status(200).json({ success: true, message: "User's batch updated successfully" });

                
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error });
    }
}

/** DELETE: http://localhost:8080/api/deletebatch
    body {
        "batchId": "7gh8h76fgbn767gh7yug67yuy7t67"
    }
*/
export async function deleteBatch(req, res){
    try {
        const { batchId } = req.body;
        const batch = await BatchModel.deleteOne({_id: batchId});

        if (batch.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'Batch deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: 'No Batch found for the given Batch ID.' });
        }
    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error });
    }
}