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
import { registerMail } from './mailer.js'
import UserModel from '../model/User.model.js';
import AssessmentModel from '../model/Assessment.model.js';

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
        const { userID } = req.user; // Assuming req.user contains authenticated user info

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

        // Function to fetch result details for the user
        const fetchResultDetails = async (assessmentId) => {
            try {
                const result = await ResultSchema.findOne({ assessment_id: assessmentId, userId: userID }).lean();
                if (result) {
                    const {  questions, userId, ...rest } = result;
                    return rest;
                }
                return null;
            } catch (error) {
                console.error("Error fetching result details:", error);
                return null;
            }
        };

        // Populate assessments without questions and include result details
        const populatedAssessments = await Promise.all(
            course.assessments.map(async (assessment) => {
                const detailedAssessment = await fetchAssessmentDetails(assessment._id); // Ensure this matches your schema
                const resultDetails = await fetchResultDetails(assessment._id);
                return { ...detailedAssessment, resultDetails };
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

/** GET: http://localhost:8080/api/getassessment?assessmentId=6620c1a48cb4bcb50f84748f&index=1 */
export const getAssesment = async (req, res) => {
    try {
        const{ userID } = req.user;
        const { assessmentId, index } = req.query;

        // Validate assessmentId
        if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID' });
        }

        // Validate userID
        if (!mongoose.Types.ObjectId.isValid(userID)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        // Validate index
        const questionIndex = parseInt(index, 10);
        if (isNaN(questionIndex) || questionIndex <= 0) {
            return res.status(400).json({ success: false, message: 'Valid index required.' });
        }

        const assessment = await AssessmentSchema.findById(assessmentId).lean();

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        const totalMarks = assessment.questions.reduce((sum, question) => sum + question.maxMarks, 0);

        let result = await ResultSchema.findOne({ assessment_id: assessmentId, userId: userID });
        if (!result) {
            result = new ResultSchema({ assessment_id: assessmentId, userId: userID, questions: [], score: 0, totalMarks: totalMarks, isSuspended: false, remarks: '' });
        } else if (result.totalMarks !== totalMarks) {
            result.totalMarks = totalMarks; // Update totalMarks if it differs
        }

        if (!result.questions.length) {
            result.questions = shuffleArray(assessment.questions).map(question => ({
                questionId: question._id,
                submittedAnswer: '',
                isCorrect: false,
                maxMarks: question.maxMarks,
                obtainedMarks: 0,
                isSubmitted: false
            }));
            await result.save();
        }

        const fetchAgain = await ResultSchema.findOne({ assessment_id: assessmentId, userId: userID })
            .populate('questions') // Populate questionId to get question details
            .lean();

        const responseData = fetchAgain.questions.map((data) => {
            const { questionId, submittedAnswer, isSubmitted, ...rest } = data;
            const questionDetail = assessment.questions.find(q => q._id.equals(questionId));
            const { answer, ...questionWithoutAnswer } = questionDetail; // Omitting 'answer' field
            return {
                ...questionWithoutAnswer,
                submittedAnswer,
                isSubmitted
            };
        });    
            
        const selectedQuestion = responseData[questionIndex - 1];

        return res.status(200).json({
            success: selectedQuestion ? true : false,
            length: responseData.length,
            timelimit: assessment.timelimit,
            isProtected: assessment.isProtected,
            data: selectedQuestion ? selectedQuestion : `Max index = ${responseData.length}`
        });
            
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
    "userId": "MongoDB ObjectId of the assessment"
}
*/
export const requestForReassessment = async (req, res) => {
    try {
        const { assessmentId, userId } = req.body;

        const assessment = await AssessmentSchema.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Check if the user has already submitted the assessment
        const userResult = await ResultSchema.findOne({ assessment_id: assessmentId, userId });

        if (!userResult || !userResult.isSubmitted) {
            return res.status(404).json({ success: false, message: 'User submission not found or not submitted' });
        }

        // Check if a job already exists for this assessment and user
        const existingJob = await AssessmentExpirySchema.findOne({ assessmentId, userId });

        if (existingJob) {
            return res.status(200).json({ success: true, message: 'Reassessment job already scheduled' });
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
    "assessment_id": "MongoDB ObjectId of the assessment",
    "questionID": "MongoDB ObjectId of the question",
    "answer": "User's submitted answer"
}
*/
export async function submitAnswerForAssessment(req, res) {
    try {
        const { userID } = req.user;
        const { assessment_id, questionID, answer } = req.body;

        // Find the assessment based on assessmentID
        const assessment = await AssessmentSchema.findById(assessment_id);

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
        let userResult = await ResultSchema.findOne({ assessment_id: assessment_id, userId: userID });

        if (!userResult) {
            userResult = new ResultSchema({
                assessment_id: assessment_id,
                userId: userID,
                questions: [],
                score: 0,
                totalMarks: 0,
                isSubmitted: false
            });
        } else {
            const questionResult = userResult.questions.find(q => q.questionId.toString() === questionID);
            if (questionResult && questionResult.isSubmitted) {
                return res.status(400).send({ success: false, message: 'Answer for this question is already submitted by this user' });
            }
        }

        // Determine if the submitted answer is correct
        const isCorrect = question.answer === answer;
        const obtainedMarks = isCorrect ? question.maxMarks : 0;

        // Add or update the question result in the result document
        const questionResultIndex = userResult.questions.findIndex(q => q.questionId.toString() === questionID);

        if (questionResultIndex === -1) {
            userResult.questions.push({
                questionId: questionID,
                submittedAnswer: answer,
                isCorrect: isCorrect,
                maxMarks: question.maxMarks,
                obtainedMarks: obtainedMarks,
                isSubmitted: true
            });
        } else {
            userResult.questions[questionResultIndex] = {
                questionId: questionID,
                submittedAnswer: answer,
                isCorrect: isCorrect,
                maxMarks: question.maxMarks,
                obtainedMarks: obtainedMarks,
                isSubmitted: true
            };
        }

        // Update the total score and total marks
        userResult.score += obtainedMarks;

        // Save the result document
        await userResult.save();

        return res.status(200).send({ success: true, message: 'Answer submitted successfully' });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).send({ success: false, message: 'Error submitting answer: ' + error.message });
    }
}

function calculateTotalMarks(questions) {
    const totalMarksObtained = questions
        .filter(question => question.isSubmitted && question.isCorrect)
        .reduce((total, question) => total + question.maxMarks, 0);

    const totalMarks = questions.reduce((total, question) => total + question.maxMarks, 0);

    return {
        totalMarksObtained,
        totalMarks
    };
}



/** PUT: http://localhost:8080/api/submitassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "assessment_id": "",
    "remarks": "",
    "status": "",
}
*/
export async function finishAssessment(req, res){
    try {
        const { userID } = req.user;
        const { assessment_id, remarks, status } = req.body;

        let result = await ResultSchema.findOne({ userId: userID, assessment_id: assessment_id });

        if (!result) {
            return res.status(404).send({ success: false, message: 'User Assessment not found.' });
        }

        // Prevent resubmission if already submitted
        if (result.isSubmitted) {
            return res.status(400).send({ success: false, message: 'Assessment already submitted. Cannot submit again.' });
        }

        result = await ResultSchema.findOneAndUpdate(
            { userId: userID, assessment_id: assessment_id },
            { $set: { isSubmitted: true, remarks: remarks, isSuspended: status } },
            { new: true }
        );

        const user = await UserModel.findById(userID);
        
        const assessment = await AssessmentModel.findById(assessment_id);
        if(!assessment){
            return res.status(404).send({success: false, message: 'Assessment not found' });

        }

        const totalMarks = calculateTotalMarks(result.questions);
        
        // Send result email
		let mailSent = false;
		await registerMail({
            body: {
                username: user.name,
                userEmail: user.email,
                subject: `Assessment Results - ${assessment.assessmentName}`,
                text: `<!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Assessment Results</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                padding: 20px;
                            }
                            .email-container {
                                background: #ffffff;
                                padding: 20px;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                max-width: 600px;
                                margin: auto;
                            }
                            h2 {
                                color: #333;
                            }
                            p {
                                font-size: 16px;
                                color: #555;
                            }
                            .highlight {
                                font-weight: bold;
                                color: #1DBF73;
                                text-transform: capitalize;
                            }
                            .footer {
                                margin-top: 20px;
                                font-size: 14px;
                                color: #777;
                            }
                        </style>
                    </head>
                    <body>

                        <div class="email-container">
                            <h2>Dear <span class="highlight">${user.name}</span>,</h2>
                            <p>I hope you're doing well.</p>
                            <p>I wanted to inform you that your results for the <span class="highlight">${assessment.assessmentName}</span> are now available.</p>
                            <p>You have scored <span class="highlight">${totalMarks.totalMarksObtained}/${totalMarks.totalMarks}</span>.</p>
                            <p>If you'd like to discuss your performance or need any feedback, feel free to reach out.</p>
                            <p class="footer">Best regards,<br>Team Hoping Minds</p>
                        </div>

                    </body>
                </html>`,
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
        return res.status(200).send({ success: true, message: "Assessment submitted successfully.", mailSent });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Error submitting Assessment: ' + error.message });
    }
}

export async function updateAssessment(req, res) {
    const { assessment_id, ...updates } = req.body; // Extract assessment_id and other updates from the body

    try {
        if (!assessment_id) {
            return res.status(400).json({ message: 'Assessment ID is required' });
        }

        const updatedAssessment = await AssessmentSchema.findOneAndUpdate(
            { _id: assessment_id },
            { $set: updates },
            { new: true } // Return the updated document
        );

        if (!updatedAssessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        res.status(200).json({ success: true, message: 'Assessment Updated', updatedAssessment });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal Server Error' + error.message });
    }
}

export async function deleteAssessment(req, res) {
    try {
        const { assessment_id } = req.body; 

        // Find and delete the assessment by assessment_id
        const result = await AssessmentSchema.findOneAndDelete({ _id: assessment_id });

        // Check if an assessment was found and deleted
        if (!result) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        res.status(201).json({ success: true, message: 'Assessment deleted successfully.' });
    } catch (error) {
        return res.status(500).send({ success: false, message: 'Internal Server Error' + error.message });
    }
}