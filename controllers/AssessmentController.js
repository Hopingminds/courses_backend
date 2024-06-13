import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import AssessmentSchema from '../model/Assessment.model.js';
import CoursesSchema from '../model/Courses.model.js';
import ResultSchema from '../model/Result.model.js';

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Define upload directory
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Define filename (timestamp + original extension)
    }
});

// File filter to allow CSV and Excel files
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
        console.log('Parsed JSON Array:', jsonArray);


        if (!jsonArray || jsonArray.length === 0) {
            return res.status(400).send('No valid data found in the uploaded file');
        }

        const courseID = req.body.courseID;
        const questions = [];

        // Iterate through JSON array to gather questions
        jsonArray.forEach((row, index) => {
            // Skip the first row if it contains headers
            // if (index === 0) return;

            // Log each row to debug
            console.log(`Processing row ${index}:`, row);

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
            assessment_id: Date.now(), // Generate assessment_id as needed
            assessmentName: "Unnamed Assessment", // Provide a default name if not provided
            startDate: new Date(),
            lastDate: new Date(),
            UploadDate: new Date(),
            questions: questions
        });

        console.log('Logging the assessment', assessment);
        // Save assessment document
        await assessment.save();

        // Update course with assessment ID
        const updatedCourse = await CoursesSchema.findOneAndUpdate(
            { courseID },
            { $push: { assessments: assessment._id } },
            { new: true, useFindAndModify: false }
        );

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
        const course = await CoursesSchema.findOne({ slug: coursename }).populate('assessments').lean();

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Function to fetch detailed assessment information without questions
        const fetchAssessmentDetails = async (assessmentId) => {
            try {
                const assessment = await AssessmentSchema.findOne({ assessment_id: assessmentId }).lean();
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
                const detailedAssessment = await fetchAssessmentDetails(assessment.assessment_id); // Ensure this matches your schema
                return detailedAssessment;
            })
        );

        // Filter out any null assessments
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

/** GET: http://localhost:8080/api/getassessments/:assessmentId */
export const getAssesment = async (req,res) => {
    try {
        const { assessmentId } = req.params;

        // Find the assessment by ObjectId
        const assessment = await AssessmentSchema.findById(assessmentId).lean();

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        // Remove the 'answer' field from each question in the assessment
        const sanitizedAssessment = {
            ...assessment,
            questions: assessment.questions.map(({ answer, ...rest }) => rest)
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
export const submitAssessment = async (req,res) => {
    try {
        const { assessmentId, userId, answers } = req.body;
        const assessment = await AssessmentSchema.findById(assessmentId).lean();

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        let score = 0;
        let totalMarks = 0;

        assessment.questions.forEach((question, index) => {
            totalMarks += question.maxMarks;

            if (answers[index] && answers[index] === question.answer) {
                score += question.maxMarks;
            }
        });

        const result = new ResultSchema({
            assessmentId,
            userId,
            score,
            totalMarks,
        });

        await result.save();

        await AssessmentSchema.findByIdAndUpdate(assessmentId, { isSubmited: true });

        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}

/** POST: http://localhost:8080/api/resetassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "assessmentId": "MongoDB ObjectId of the assessment"
}
*/
export const requestForReassesment = async (req, res) => {
    try {
        const { assessmentId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
            return res.status(400).json({ success: false, message: 'Invalid assessment ID or user ID' });
        }

        const assessment = await AssessmentSchema.findById(assessmentId);

        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        assessment.isSubmited = false;
        await assessment.save();

        res.status(200).json({ success: true, message: 'Assessment reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}