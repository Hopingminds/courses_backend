import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import cron from 'node-cron';
import AssessmentSchema from '../model/Assessment.model.js';
import CoursesSchema from '../model/Courses.model.js';
import ResultSchema from '../model/Result.model.js';
import AssessmentExpirySchema from '../model/AssessmentExpiry.model.js';
import mongoose from 'mongoose';

// Ensure the uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Define upload directory using absolute path
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Define filename (timestamp + original extension)
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV or Excel files are allowed'), false);
    }
};


export const upload = multer({ storage: storage, fileFilter: fileFilter });

/** POST: http://localhost:8080/api/createcourseassessment
* @param: {
    "header" : "Admin <token>"
}
body: {
    "courseID": "React Js",
    "assessmentName": "assessmentName",
    "questions":".xlsx file"
    "startDate":"Date" optional,
    "lastDate":"Date" optional,
    "isProtected":"isProtected"
}
*/
export const createAssessment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        let jsonArray;

        if (req.file.mimetype === 'application/vnd.ms-excel' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
            const worksheet = workbook.Sheets[sheetName];
            jsonArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
            return res.status(400).send('Unsupported file type');
        }

        if (!jsonArray || jsonArray.length === 0) {
            return res.status(400).send('No valid data found in the uploaded file');
        }

        const { courseID, assessmentName, startDate, lastDate, isProtected, timelimit } = req.body;

        const questions = [];

        // Iterate through JSON array to gather questions
        jsonArray.forEach((row, index) => {
            const [question, ...rest] = row;
            const maxMarks = rest.pop(); // Assume the last element is max marks
            const correctOption = rest.pop(); // Assume the second last element is the correct option
            const options = rest.map(option => ({ option })); // Convert remaining elements to the desired format

            if (!question || options.length < 1 || !correctOption || !maxMarks) {
                throw new Error(`Invalid data in row: ${JSON.stringify(row)}`);
            }

            // Add question to the questions array
            questions.push({
                question,
                options, // Options as an array of objects
                answer: correctOption,
                maxMarks: maxMarks // Max marks from the row
            });
        });

        // Create a single assessment object with all questions
        const assessment = new AssessmentSchema({
            assessmentName: assessmentName || "Unnamed Assessment", // Use provided name or default
            startDate: startDate ? new Date(startDate) : new Date(),
            lastDate: lastDate ? new Date(lastDate) : new Date(),
            UploadDate: new Date(),
            isProtected: isProtected,
            timelimit: timelimit,
            questions: questions
        });

        
        await assessment.save();

        const updatedCourse = await CoursesSchema.findOneAndUpdate(
            { courseID },
            { $push: { assessments: assessment._id } },
            { new: true, useFindAndModify: false }
        );

        if (!updatedCourse) {
            return res.status(404).send('Course not found');
        }

        res.status(201).json({
            success: true,
            message: "Assessment created and added to the course successfully",
            assessment,
            updatedCourse
        });

    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).send('Error creating assessment: ' + error.message);
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
        }
    }
};

/** GET: http://localhost:8080/api/courseassessments/:coursename */
export const getCourseAllAssessment = async (req, res) => {
    try {
        const { coursename } = req.params;

        // Find the course by slug and populate assessments
        const course = await CoursesSchema.findOne({ slug: coursename }).populate('assessments').lean();

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Function to fetch detailed assessment information without questions
        const fetchAssessmentDetails = async (assessmentId) => {
            try {
                const assessment = await AssessmentSchema.findById(assessmentId).lean();
                if (assessment) {
                    // Exclude questions field
                    const { questions, ...rest } = assessment;
                    return rest;
                }
                return null;
            } catch (error) {
                console.error("Error fetching assessment details:", error);
                return null;
            }
        };

        // Populate assessments without questions
        const populatedAssessments = await Promise.all(
            course.assessments.map(async (assessment) => {
                const detailedAssessment = await fetchAssessmentDetails(assessment._id); // Ensure this matches your schema
                return detailedAssessment;
            })
        );

        // Filter out any null assessments (if any error occurred during fetching)
        const filteredAssessments = populatedAssessments.filter(assessment => assessment !== null);

        res.status(200).json({ success: true, assessments: filteredAssessments });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Function to shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/** GET: http://localhost:8080/api/getassessment/:assessmentId */
export const getAssesment = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        const assessment = await AssessmentSchema.findById(assessmentId).lean();

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Remove the 'answer' field from each question in the assessment
        let sanitizedQuestions = assessment.questions.map(({ answer, ...rest }) => rest);

        // Shuffle the questions
        sanitizedQuestions = shuffleArray(sanitizedQuestions);

        // If there are more than 30 questions, select only 30 random questions
        if (sanitizedQuestions.length > 30) {
            sanitizedQuestions = sanitizedQuestions.slice(0, 30);
        }

        const sanitizedAssessment = {
            ...assessment,
            questions: sanitizedQuestions
        };

        res.status(200).json({ success: true, assessment: sanitizedAssessment });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}

/** POST: http://localhost:8080/api/submitassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "assessmentId": "MongoDB ObjectId of the assessment",
    "userId": "MongoDB ObjectId of the user submitting",
    "answers": "Array of answers corresponding to the assessment questions"
}
*/
export const submitAssessment = async (req, res) => {
    try {
        const { userID, assessment_id } = req.body;

        // Ensure the assessment_id is properly formatted
        const formattedAssessmentId = new mongoose.Types.ObjectId(assessment_id);

        // Find the assessment based on assessmentID
        const assessment = await AssessmentSchema.findById(formattedAssessmentId).lean();

        if (!assessment) {
            return res.status(404).send({ success: false, message: 'Assessment not found' });
        }

        // Calculate the total marks of the assessment
        const totalMarks = assessment.questions.reduce((acc, question) => acc + question.maxMarks, 0);

        // Find the result document for this assessment and user
        let result = await ResultSchema.findOne({ assessment_id: formattedAssessmentId, userId: userID });
        if (!result) {
            return res.status(404).send({ success: false, message: 'Result not found for this user and assessment' });
        }

        // Check if the assessment is already submitted
        if (result.isSubmitted) {
            return res.status(400).send({ success: false, message: 'Assessment is already submitted' });
        }

        // Mark the assessment as submitted and update total marks
        result.isSubmitted = true;
        result.totalMarks = totalMarks;
        await result.save();

        return res.status(200).send({ success: true, message: 'Assessment submitted successfully', result });
    } catch (error) {
        console.error('Error submitting assessment:', error);
        return res.status(500).send({ success: false, message: 'Error submitting assessment: ' + error.message });
    }
};

/** POST: http://localhost:8080/api/resetassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "assessmentId": "MongoDB ObjectId of the assessment"
}
*/
export const requestForReassessment = async (req, res) => {
    try {
        const { assessmentId, userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(assessmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID or user ID' });
        }

        const assessment = await AssessmentSchema.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Check if the user has already submitted the assessment
        const userResult = await ResultSchema.findOne({ assessment_id: assessmentId, userId });

        if (!userResult || !userResult.isSubmitted) {
            return res.status(404).json({ success: false, message: 'User submission not found or not submitted' });
        }

        // Calculate expiration date (3 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        // Create a job schedule in the database
        const job = new AssessmentExpirySchema({ assessmentId, userId, expiresAt });
        await job.save();

        // Schedule the job using cron
        const jobId = job._id.toString();
        cron.schedule('0 0 * * *', async () => {
            const now = new Date();
            const job = await AssessmentExpirySchema.findById(jobId);

            if (job && now >= job.expiresAt) {
                // Reset the isSubmitted flag to false for the specific user in the ResultSchema
                const updatedResult = await ResultSchema.findOneAndUpdate(
                    { assessment_id: assessmentId, userId },
                    { $set: { isSubmitted: false } },
                    { new: true }
                );

                // Delete the job from the database
                await AssessmentExpirySchema.findByIdAndDelete(jobId);

                console.log(`User ${userId} submission flag reset for assessment ${assessmentId}`);
            }
        });

        res.status(200).json({ success: true, message: 'User-specific assessment reset scheduled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}


/** PUT: http://localhost:8080/api/submitassessmentanswer
 * @param: {
    "header" : "User <token>"
}
 * @body : {
    "assessmentID": "MongoDB ObjectId of the assessment",
    "questionID": "MongoDB ObjectId of the question",
    "answer": "User's submitted answer",
    UserId: "userId"
}
*/
export async function submitAnswerForAssessment(req, res) {
    try {
        const { userID, assessment_id, questionID, answer } = req.body;

        console.log('Received request data:', { userID, assessment_id, questionID, answer });

        // Ensure the assessment_id is properly formatted
        const formattedAssessmentId = new mongoose.Types.ObjectId(assessment_id);

        // Find the assessment based on assessmentID
        const assessment = await AssessmentSchema.findById(formattedAssessmentId);

        console.log('Assessment found:', assessment);

        if (!assessment) {
            return res.status(404).send({ success: false, message: 'Assessment not found' });
        }

        // Find the index of the question in the questions array using the question ID
        const questionIndex = assessment.questions.findIndex(q => q._id.toString() === questionID);

        if (questionIndex === -1) {
            return res.status(404).send({ success: false, message: 'Question not found in the assessment' });
        }

        const question = assessment.questions[questionIndex];

        // Check if the answer for this question is already submitted by the same user
        const result = await ResultSchema.findOne({ assessment_id: formattedAssessmentId, userId: userID });
        if (result) {
            const questionResultIndex = result.questions.findIndex(q => q.questionId.toString() === questionID);
            if (questionResultIndex !== -1) {
                return res.status(400).send({ success: false, message: 'Answer for this question is already submitted by this user' });
            }
        }

        // Determine if the submitted answer is correct
        const isCorrect = question.answer === answer;
        const obtainedMarks = isCorrect ? question.maxMarks : 0;

        // Find or create a result document for this assessment and user
        let userResult = await ResultSchema.findOne({ assessment_id: formattedAssessmentId, userId: userID });
        if (!userResult) {
            userResult = new ResultSchema({
                assessment_id: formattedAssessmentId,
                userId: userID,
                questions: [],
                score: 0,
                totalMarks: 0,
                isSubmitted: false
            });
        }

        // Add the question result to the result document
        userResult.questions.push({
            questionId: questionID,
            submittedAnswer: answer,
            isCorrect: isCorrect,
            maxMarks: question.maxMarks,
            obtainedMarks: obtainedMarks
        });

        // Update the total score and total marks
        userResult.score += obtainedMarks;
        userResult.totalMarks += question.maxMarks;

        // Save the result document
        await userResult.save();

        return res.status(200).send({ success: true, message: 'Answer submitted successfully' });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).send({ success: false, message: 'Error submitting answer: ' + error.message });
    }
}
