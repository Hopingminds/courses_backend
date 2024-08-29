import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import csv from 'csv-parser';
import ModuleAssessmentModel from '../model/ModuleAssessment.model.js';
import AssessmentModuleModel from '../model/AssessmentModule.model.js';
import QnaModel from '../model/Qna.model.js';
import UserModuleAssessmentReportModel from '../model/UserModuleAssessmentReport.model.js';

/** POST: http://localhost:8080/api/createmoduleassessment
* @param: {
    "header" : "Admin <token>"
}
body: {
    "assessment_id": 54321,
    "assessmentName": "Midterm Exam",
    "maxMarks": 50,
    "startDate": "2024-10-01T09:00:00Z",
    "lastDate": "2024-10-10T18:00:00Z",
    "timelimit": 90,
    "isProtected": false,
    "ProctoringFor": {
        "mic": {
            "inUse": true,
            "maxRating": 4
        },
        "webcam": {
            "inUse": true,
            "maxRating": 5
        },
        "TabSwitch": {
            "inUse": true
        },
        "multiplePersonInFrame": {
            "inUse": false
        },
        "PhoneinFrame": {
            "inUse": true
        },
        "SoundCaptured": {
            "inUse": true,
            "maxRating": 3
        }
    },
    "Assessmentmodules": [
        {
            "module_id": 101,
            "moduleName": "Module 1",
            "timelimit": 60
        }
    ]
}
*/
export async function createModuleAssessment(req, res) {
	try {
		const { 
            assessment_id, 
            assessmentName, 
            maxMarks, 
            startDate, 
            lastDate, 
            timelimit, 
            isProtected, 
            ProctoringFor, 
            assessmentDesc,
            Assessmentmodules 
        } = req.body;

        let populatedModules = [];

        // Check if Assessmentmodules is provided and not empty
        if (Assessmentmodules && Assessmentmodules.length > 0) {
            populatedModules = await Promise.all(
                Assessmentmodules.map(async (module) => {
                    const newModule = new AssessmentModuleModel({
                        module_id: module.module_id,
                        moduleName: module.moduleName,
                        timelimit: module.timelimit,
                    });

                    await newModule.save();
                    return { module: newModule._id };
                })
            );
        }

        // Create the ModuleAssessment document
        const moduleAssessment = new ModuleAssessmentModel({
            assessment_id,
            assessmentName,
            maxMarks,
            startDate,
            lastDate,
            timelimit,
            isProtected,
            ProctoringFor,
            assessmentDesc,
            Assessmentmodules: populatedModules,
        });

        // Save the ModuleAssessment document to the database
        await moduleAssessment.save();

        return res.status(201).json({ success: true, data: moduleAssessment });
	} catch (error) {
		return res.status(500).json({ success: false, error: 'Internal server error' })
	}
}

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

export function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

export const upload = multer({ storage: storage, fileFilter: fileFilter }).single('questions');

/** POST: http://localhost:8080/api/addquestionstoassessmentmodule
* @param: {
    "header" : "Admin <token>"
}
body: {
    "moduleAssessmentid":"6620b6b7a3340a8de1a70bc0",
    "moduleId":"6620b6b7a3340a8de1a70bc0",
    "questions": "file.csv"
}
*/
export async function addQuestionsToModuleAssessment(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: true, message: 'File upload error', error: err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }

        const { moduleId, moduleAssessmentid } = req.body;

        if (!moduleId || !moduleAssessmentid) {
            return res.status(400).json({ success: false, message: 'Module ID and ModuleAssessment ID are required' });
        }

        try {
            const moduleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid);
            if (!moduleAssessment) {
                return res.status(404).json({ success: false, message: 'ModuleAssessment not found' });
            }

            const isModuleInAssessment = moduleAssessment.Assessmentmodules.some(
                (module) => module.module.toString() === moduleId
            );
            if (!isModuleInAssessment) {
                return res.status(404).json({ success: false, message: 'Module is not associated with the given ModuleAssessment' });
            }

            const AssessmentModule = await AssessmentModuleModel.findById(moduleId);
            if (!AssessmentModule) {
                return res.status(404).json({ success: false, message: 'Invalid module ID' });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            let jsonArray = [];
            try {
                if (req.file.mimetype === 'application/vnd.ms-excel' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const workbook = xlsx.readFile(req.file.path);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                } else if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/csv') {
                    jsonArray = await parseCSV(req.file.path);
                } else {
                    return res.status(400).json({ success: false, message: 'Unsupported file type' });
                }
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Error parsing file', error: error.message });
            }

            if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid file content' });
            }

            const headers = Array.isArray(jsonArray[0]) ? jsonArray[0] : Object.keys(jsonArray[0]);
            const results = [];

            for (let i = 1; i < jsonArray.length; i++) {
                const row = jsonArray[i];
                const questionData = {
                    question: row[headers.indexOf('question')],
                    opt_1: row[headers.indexOf('opt_1')],
                    opt_2: row[headers.indexOf('opt_2')],
                    opt_3: row[headers.indexOf('opt_3')],
                    opt_4: row[headers.indexOf('opt_4')],
                    answer: row[headers.indexOf('answer')],
                    maxMarks: row[headers.indexOf('maxMarks')]
                };

                try {
                    const newQuestion = new QnaModel({
                        question: questionData.question,
                        options: {
                            opt_1: questionData.opt_1,
                            opt_2: questionData.opt_2,
                            opt_3: questionData.opt_3,
                            opt_4: questionData.opt_4
                        },
                        answer: questionData.answer,
                        maxMarks: questionData.maxMarks
                    });

                    await newQuestion.save();
                    AssessmentModule.questions.push(newQuestion._id);
                    await AssessmentModule.save();

                    results.push({ success: true, message: 'Question added successfully', data: newQuestion });
                } catch (error) {
                    console.error('Error adding question:', error);
                    return res.status(500).json({ success: false, message: 'Error adding question', error: error.message, questionAt: i+1 });
                }
            }
            return res.status(201).json({ success: true, results });
        } catch (error) {
            console.error('Unexpected error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        } finally {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
        }
    });
}

/** GET: http://localhost:8080/api/getmoduleassessment/:moduleAssessmentid
* @param: {
    "header" : "<token>"
}
*/
export async function getModuleAssessment(req, res) {
    const { moduleAssessmentid } = req.params;

    if (!moduleAssessmentid) {
        return res.status(400).json({ success: false, message: 'ModuleAssessment ID is required' });
    }

    try {
        // Find the ModuleAssessment by ID
        const moduleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid)
            .populate({
                path: 'Assessmentmodules.module',
            });

        if (!moduleAssessment) {
            return res.status(404).json({ success: false, message: 'ModuleAssessment not found' });
        }

        return res.status(200).json({ success: true, data: moduleAssessment });
    } catch (error) {
        console.error('Error fetching ModuleAssessment:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** PUT: http://localhost:8080/api/updatemoduleassessment/:moduleAssessmentid
* @param: {
    "header" : "Admin <token>"
}
body: {
    assessmentData with all the ids
}
*/
export async function editModuleAssessment(req, res) {
    const { moduleAssessmentid } = req.params;
    const updates = req.body;

    if (!moduleAssessmentid) {
        return res.status(400).json({ success: false, message: 'ModuleAssessment ID is required' });
    }

    try {
        // Find the existing ModuleAssessment
        const existingModuleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid)
            .populate('Assessmentmodules.module');

        if (!existingModuleAssessment) {
            return res.status(404).json({ success: false, message: 'ModuleAssessment not found' });
        }

        // Extract existing module IDs
        const existingModuleIds = existingModuleAssessment.Assessmentmodules.map(mod => mod.module._id.toString());

        // Arrays to hold the valid, new, and invalid modules
        const validModules = [];
        const newModules = [];
        const invalidModules = [];

        // Loop through each updated module
        for (const mod of updates.Assessmentmodules) {
            if (mod.module && mod.module._id) {
                const moduleId = mod.module._id.toString();
                if (existingModuleIds.includes(moduleId)) {
                    // Update the existing module data in the database
                    await AssessmentModuleModel.findByIdAndUpdate(
                        moduleId,
                        { ...mod.module },
                        { new: true, runValidators: true }
                    );
                    validModules.push(mod);
                } else {
                    invalidModules.push(mod);
                }
            } else {
                // It's a new module, create it in the database
                const createdModule = await AssessmentModuleModel.create(mod.module);
                validModules.push({ module: createdModule._id });
            }
        }


        if (invalidModules.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Some modules are not valid for update',
                invalidModules
            });
        }

        // Handle the new modules: create them in the database first
        for (let newModule of newModules) {
            const createdModule = await AssessmentModuleModel.create(newModule.module);
            validModules.push({ module: createdModule._id });
        }

        // Proceed with the update by setting the updated Assessmentmodules
        updates.Assessmentmodules = validModules;

        const updatedModuleAssessment = await ModuleAssessmentModel.findByIdAndUpdate(
            moduleAssessmentid,
            { ...updates },
            { new: true, runValidators: true }
        ).populate({
            path: 'Assessmentmodules.module',
            populate: {
                path: 'questions',
                model: 'Qna'
            }
        });

        return res.status(200).json({ success: true, data: updatedModuleAssessment });
    } catch (error) {
        console.error('Error updating ModuleAssessment:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }

}

/** DELETE: http://localhost:8080/api/deletemodulefromassessment
* @param: {
    "header" : "Admin <token>"
}
body: {
    "moduleAssessmentid":"66cda03e48671d0f30160493",
    "moduleid":"66cda0af48671d0f30160556"
}
*/
export async function deleteModuleFromAssessment(req, res) {
    const { moduleAssessmentid, moduleid } = req.body;

    if (!moduleAssessmentid || !moduleid) {
        return res.status(400).json({ success: false, message: 'ModuleAssessment ID and Module ID are required' });
    }

    try {
        // Find the existing ModuleAssessment
        const existingModuleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid);

        if (!existingModuleAssessment) {
            return res.status(404).json({ success: false, message: 'ModuleAssessment not found' });
        }

        // Filter out the module to be deleted
        const updatedModules = existingModuleAssessment.Assessmentmodules.filter(
            mod => mod.module._id.toString() !== moduleid
        );

        if (updatedModules.length === existingModuleAssessment.Assessmentmodules.length) {
            return res.status(404).json({ success: false, message: 'Module not found in this assessment' });
        }

        // Update the ModuleAssessment with the remaining modules
        existingModuleAssessment.Assessmentmodules = updatedModules;

        await existingModuleAssessment.save();

        // Delete the module from the AssessmentModuleModel
        const deletedModule = await AssessmentModuleModel.findByIdAndDelete(moduleid);

        if (!deletedModule) {
            return res.status(404).json({ success: false, message: 'Module not found in AssessmentModule collection' });
        }

        return res.status(200).json({ success: true, message: 'Module deleted successfully', data: existingModuleAssessment });
    } catch (error) {
        console.error('Error deleting module from ModuleAssessment:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/** POST: http://localhost:8080/api/startmoduleassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "moduleAssessmentid":"6620b6b7a3340a8de1a70bc0"
}
*/
export async function StartAssessment(req, res) {
    try {
        const { userID } = req.user;
        const { moduleAssessmentid } = req.body;

        const moduleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid).populate('Assessmentmodules.module');

        if (!moduleAssessment) {
            return res.status(404).json({ success: false, message: 'Module Assessment not found' });
        }

        // Find the UserModuleAssessmentReport for this user and module assessment
        let userModuleAssessmentReport = await UserModuleAssessmentReportModel.findOne({
            user: userID,
            moduleAssessment: moduleAssessmentid
        });

        // Check if the assessment has already been completed
        if (userModuleAssessmentReport && userModuleAssessmentReport.isAssessmentCompleted) {
            return res.status(400).json({ success: false, message: 'Assessment has already been completed' });
        }

        // Prepare generatedModules structure
        const generatedModules = moduleAssessment.Assessmentmodules.map(({ module }) => {
            // Shuffle questions before saving them
            const shuffledQuestions = shuffleArray(module.questions.map(question => ({
                question: question._id,
                isSubmitted: false,
                submittedAnswer: ''
            })));

            return {
                module: {
                    modueleInfo: module._id,
                    generatedQustionSet: shuffledQuestions
                }
            };
        });

        if (userModuleAssessmentReport) {
            // If the report exists and assessment is not completed, update it
            userModuleAssessmentReport.generatedModules = generatedModules;
        } else {
            // If the report doesn't exist, create a new one
            userModuleAssessmentReport = new UserModuleAssessmentReportModel({
                user: userID,
                moduleAssessment: moduleAssessmentid,
                generatedModules,
            });
        }

        // Save the report
        await userModuleAssessmentReport.save();

        return res.status(200).json({ success: true, message: 'Assessment started successfully', report: userModuleAssessmentReport });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getassesmentquestion?moduleAssessmentid=6620c1a48cb4bcb50f84748f&moduleid=6620c1a48cb4bcb50f84748f&index=1 
* @param: {
    "header" : "User <token>"
}
*/ 
export async function getAssesmentQuestion(req, res) {
    try {
        const { userID } = req.user;
        let { moduleAssessmentid, index } = req.query;
        index--;
        // Find the UserModuleAssessmentReport for this user and module assessment
        const userModuleAssessmentReport = await UserModuleAssessmentReportModel.findOne({
            user: userID,
            moduleAssessment: moduleAssessmentid
        });

        if (!userModuleAssessmentReport) {
            return res.status(404).json({ success: false, message: 'User Assessment not found' });
        }

        if(userModuleAssessmentReport.isAssessmentCompleted){
            return res.status(404).json({ success: false, message: 'Question can\'t be provided as the assessment is already completed' });
        }

        // Calculate the total number of questions in the entire assessment
        const totalQuestions = userModuleAssessmentReport.generatedModules.reduce((total, module) => {
            return total + module.module.generatedQustionSet.length;
        }, 0);

        // Determine the current module based on the index and start tracking cumulative questions
        let cumulativeIndex = 0;
        let moduleReport = null;
        let moduleIndex = 0;

        for (let i = 0; i < userModuleAssessmentReport.generatedModules.length; i++) {
            const module = userModuleAssessmentReport.generatedModules[i];
            const questionSetLength = module.module.generatedQustionSet.length;

            if (index < cumulativeIndex + questionSetLength) {
                moduleReport = module;
                moduleIndex = index - cumulativeIndex;
                break;
            }

            cumulativeIndex += questionSetLength;
        }

        if (!moduleReport) {
            return res.status(404).json({ success: false, message: 'Question not found in the user assessment' });
        }

        // Get the specific question using the calculated moduleIndex
        const questionSet = moduleReport.module.generatedQustionSet;
        const questionEntry = questionSet[moduleIndex];

        if (!questionEntry) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // Fetch the full question details excluding the answer
        const question = await QnaModel.findById(questionEntry.question._id, 'question options maxMarks');

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found in the Qna collection' });
        }

        // Return the question details without the answer
        return res.status(200).json({
            success: true,
            message: 'Question retrieved successfully',
            question: {
                _id: question._id,
                question: question.question,
                options: question.options,
                maxMarks: question.maxMarks
            },
            totalQuestions, // Correct total number of questions in the entire assessment
            isSubmitted: questionEntry.isSubmitted,
            submittedAnswer: questionEntry.submittedAnswer
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getusermoduleassessment/:moduleAssessmentid
* @param: {
    "header" : "User <token>"
}
*/
export async function getUserModuleAssessment(req, res){
    const { userID } = req.user;
    const { moduleAssessmentid } = req.params;

    if (!moduleAssessmentid) {
        return res.status(400).json({ success: false, message: 'ModuleAssessment ID is required' });
    }

    try {
        // Fetch the user's assessment report
        const userTestReport = await UserModuleAssessmentReportModel.findOne({
            user: userID,
            moduleAssessment: moduleAssessmentid
        });

        // Find the ModuleAssessment by ID with populated modules
        const moduleAssessment = await ModuleAssessmentModel.findById(moduleAssessmentid)
            .populate({
                path: 'Assessmentmodules.module'
            });

        if (!moduleAssessment) {
            return res.status(404).json({ success: false, message: 'ModuleAssessment not found' });
        }

        // Aggregate progress for each module
        const modulesWithProgress = moduleAssessment.Assessmentmodules.map(({ module }) => {
            // Find the corresponding report for this module
            const userModuleReport = userTestReport?.generatedModules.find(
                report => report.module.modueleInfo.toString() === module._id.toString()
            );

            // Calculate progress if module is found in user's report
            return {
                module,
                progress: userModuleReport ? calculateProgress(userModuleReport.module) : 0
            };
        });

        // Calculate overall progress for the entire ModuleAssessment
        const totalProgress = modulesWithProgress.reduce((sum, mod) => sum + mod.progress, 0) / modulesWithProgress.length || 0;

        // Extract additional fields from the user's report, if available
        const isAssessmentCompleted = userTestReport ? userTestReport.isAssessmentCompleted : false;
        const isSuspended = userTestReport ? userTestReport.isSuspended : false;

        return res.status(200).json({
            success: true,
            data: {
                ...moduleAssessment.toObject(),
                Assessmentmodules: modulesWithProgress,
                totalProgress, // Add total progress for this assessment
                isAssessmentCompleted, // Add completion status
                isSuspended // Add suspension status
            }
        });
    } catch (error) {
        console.error('Error fetching ModuleAssessment:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

function calculateProgress(module) {
    const submittedCount = module.generatedQustionSet.filter(question => question.isSubmitted).length;
    const totalQuestions = module.generatedQustionSet.length;
    return totalQuestions === 0 ? 0 : (submittedCount / totalQuestions) * 100;
}

/** GET: http://localhost:8080/api/getallusermoduleassessment
* @param: {
    "header" : "User <token>"
}
*/
export async function getAllModuleAssessment(req, res) {
    try {
        const { userID } = req.user;

        // Fetch the user's assessment report
        const userTestReport = await UserModuleAssessmentReportModel.findOne({
            user: userID
        });

        // Fetch all module assessments with populated Assessmentmodules and their related modules
        const moduleAssessments = await ModuleAssessmentModel.find({ isVisible: true })
            .populate({ path: 'Assessmentmodules.module' });

        if (!moduleAssessments || moduleAssessments.length === 0) {
            return res.status(404).json({ success: false, message: 'No Assessments found' });
        }

        // Calculate total progress for each module assessment
        const moduleAssessmentsWithProgress = moduleAssessments.map(moduleAssessment => {
            // Aggregate progress for each module
            const modulesWithProgress = moduleAssessment.Assessmentmodules.map(({ module }) => {
                // Find the corresponding report for this module
                const userModuleReport = userTestReport?.generatedModules.find(
                    report => report.module.modueleInfo.toString() === module._id.toString()
                );

                // Calculate progress if module is found in user's report
                return {
                    module,
                    progress: userModuleReport ? calculateProgress(userModuleReport.module) : 0
                };
            });

            // Calculate overall progress for all modules in this assessment
            const totalProgress = modulesWithProgress.reduce((sum, mod) => sum + mod.progress, 0) / modulesWithProgress.length || 0;

            // Extract additional fields from the user's report, if available
            const assessmentReport = userTestReport?.generatedModules.find(
                report => report.module.modueleInfo.toString() === moduleAssessment._id.toString()
            );
            const isAssessmentCompleted = assessmentReport ? assessmentReport.isAssessmentCompleted : false;
            const isSuspended = assessmentReport ? assessmentReport.isSuspended : false;

            return {
                ...moduleAssessment.toObject(),
                Assessmentmodules: modulesWithProgress,
                totalProgress, // Add total progress for this assessment
                isAssessmentCompleted, // Add completion status
                isSuspended // Add suspension status
            };
        });

        return res.status(200).json({ success: true, data: moduleAssessmentsWithProgress });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** PUT: http://localhost:8080/api/submitanswerformoduleassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "moduleAssessmentid": "MongoDB ObjectId of the assessment",
    "moduleid": "MongoDB ObjectId of the module",
    "questionId": "MongoDB ObjectId of the question submitting",
    "answer": "Array of answers corresponding to the assessment questions"
}
*/
export async function submitAnswerForModuleAssessment(req, res) {
    try {
        const { userID } = req.user;
        let { moduleAssessmentid, index, answer } = req.body;
        index--;
        const userAssessmentReport = await UserModuleAssessmentReportModel.findOne({
            user: userID,
            moduleAssessment: moduleAssessmentid
        });

        if (!userAssessmentReport) {
            return res.status(404).json({ success: false, message: 'Assessment report not found' });
        }

        // Iterate through each module to find the question by index
        let questionReport;
        let questionModule;
        let totalQuestions = 0;

        for (const module of userAssessmentReport.generatedModules) {
            const questionSet = module.module.generatedQustionSet;

            if (totalQuestions + questionSet.length > index) {
                questionReport = questionSet[index - totalQuestions];
                questionModule = module;
                break;
            }

            totalQuestions += questionSet.length;
        }

        if (!questionReport) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        // Update the submitted answer
        questionReport.submittedAnswer = answer;
        questionReport.isSubmitted = true;

        // Save the updated report
        await userAssessmentReport.save();

        return res.status(200).json({ success: true, message: 'Answer submitted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** PUT: http://localhost:8080/api/submitmoduleassessment
* @param: {
    "header" : "User <token>"
}
body: {
    "moduleAssessmentid": "66cda03e48671d0f30160493",
    "isAssessmentCompleted":true,
    "isSuspended": false,
    "ProctoringScore":{
        "mic":"345",
        "webcam":"643",
        "TabSwitch":"3456",
        "multiplePersonInFrame":"2342",
        "PhoneinFrame":"3456",
        "SoundCaptured":"5432"
    },
    "remarks":"ye kya kar diya"
}
*/
export async function finishModuleAssessment(req, res) {
    try {
        const { userID } = req.user;
        const { moduleAssessmentid, isSuspended, ProctoringScore, remarks } = req.body;

        // Validate moduleAssessmentid
        if (!moduleAssessmentid) {
            return res.status(400).send({ success: false, message: 'Invalid moduleAssessmentid provided.' });
        }
        const userReport = await UserModuleAssessmentReportModel.findOneAndUpdate(
            { user: userID, moduleAssessment: moduleAssessmentid },
            { $set: { isAssessmentCompleted: true, isSuspended, ProctoringScore, remarks } },
            { new: true }
        )

        if (!userReport) {
            return res.status(404).send({ success: false, message: 'User Assessment not found or already completed.' });
        }

        return res.status(200).send({ success: true, message: "Assessment submitted successfully." });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getallmoduleassessment
* @param: {
    "header" : "Admin <token>"
}
*/
export async function getAllModuleAssessmentForAdmin(req, res) {
    try {
        const moduleAssessments = await ModuleAssessmentModel.find().populate({ path: 'Assessmentmodules.module' });

        if(!moduleAssessments){
            return res.status(200).send({ success: true, message: 'No Assessment\'s Found' });
        }
        return res.status(200).send({ success: true, data: moduleAssessments });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getallusersresultbymoduleassessment/:moduleAssessmentid
* @param: {
    "header" : "Admin <token>"
}
*/
export async function getAllUsersResultByModuleAssessment(req, res) {
    try {
        const { moduleAssessmentid } = req.params;
        if(!moduleAssessmentid){
            return res.status(404).send({ success: false, message: 'moduleAssessmentid is Required' });
        }
        const userReports = await UserModuleAssessmentReportModel.find({ moduleAssessment: moduleAssessmentid})
            .populate({
                path: 'generatedModules.module.modueleInfo',
                model: 'AssessmentModule',
                select: '-questions'
            })
            .populate({
                path: 'user',
                model: 'User',
                select: '-password -token -purchased_courses'
            })
            .populate({
                path: 'generatedModules.module.generatedQustionSet.question',
                model: 'Qna'
            });
        
            if (!userReports || userReports.length === 0) {
                return res.status(404).send({ success: false, message: 'No User\'s Assessment Report Found' });
            }
    
            // Calculate totalMarks and maxMarks for each user
            const userReportsWithMarks = userReports.map(userReport => {
                let totalMarks = 0;
                let maxMarks = 0;
    
                userReport.generatedModules.forEach(module => {
                    module.module.generatedQustionSet.forEach(questionSet => {
                        const question = questionSet.question;
                        if (questionSet.isSubmitted && questionSet.submittedAnswer === question.answer) {
                            totalMarks += question.maxMarks;
                        }
                        maxMarks += question.maxMarks;
                    });
    
                    // Remove generatedQustionSet from the module
                    module.module = {
                        ...module.module.toObject(),
                        generatedQustionSet: undefined
                    };
                });
    
                return {
                    ...userReport.toObject(),
                    totalMarks,
                    maxMarks
                };    
            });
    
            return res.status(200).send({ success: true, data: userReportsWithMarks });    
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getuserresultbymoduleassessment?userID=66acc4dfbba451ebd918670b&moduleAssessmentid=66cda03e48671d0f30160493
* @param: {
    "header" : "Admin <token>"
}
*/
export async function getUsersResultByModuleAssessment(req, res) {
    try {
        const { userID, moduleAssessmentid } = req.query;

        const userReports = await UserModuleAssessmentReportModel.findOne({ user: userID, moduleAssessment: moduleAssessmentid})
            .populate({
                path: 'generatedModules.module.modueleInfo',
                model: 'AssessmentModule',
                select: '-questions'
            })
            .populate({
                path: 'user',
                model: 'User',
                select: '-password -token -purchased_courses'
            })
            .populate({
                path: 'generatedModules.module.generatedQustionSet.question',
                model: 'Qna'
            });

        if(!userReports){
            return res.status(200).send({ success: true, message: 'No User\'s Found' });
        }
        let totalMarks = 0;
        let maxMarks = 0;

        // Iterate through each module to calculate marks
        userReports.generatedModules.forEach(module => {
            module.module.generatedQustionSet.forEach(questionSet => {
                const question = questionSet.question;
                if (questionSet.isSubmitted && questionSet.submittedAnswer === question.answer) {
                    totalMarks += question.maxMarks;
                }
                maxMarks += question.maxMarks;
            });
        });

        // Add the calculated marks to the response data
        const responseData = {
            ...userReports.toObject(),
            totalMarks,
            maxMarks
        };

        return res.status(200).send({ success: true, data: responseData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}