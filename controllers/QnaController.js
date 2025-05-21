import QnaModel from "../model/Qna.model.js"
import TestModuleModel from "../model/Testmodule.model.js"
import UsertestreportModel from "../model/Usertestreport.model.js";
import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';

/** POST: http://localhost:8080/api/addquestiontomodule
* @param: {
    "header" : "Admin <token>"
}
body: {
    "module_id":"6620b6b7a3340a8de1a70bc0",
    "question": "This is a question",
    "options":{
        "opt_1":"Option 1",
        "opt_2":"Option 2",
        "opt_3":"Option 3",
        "opt_4":"Option 4"
    },
    "answer": "opt_3"
}
*/
export async function addQuestionToModule(req, res) {
	try {
		const question = req.body
        // console.log(question);
        const TestModule = await TestModuleModel.findOne({
			_id:question.module_id
		})

		if (!TestModule) {
			return res
				.status(404)
				.json({ error: 'Invalid module ID' })
		}

		const newQuestion = new QnaModel(question)
		await newQuestion.save()
        if (newQuestion.id) {
            TestModule.questions.push(newQuestion.id)
            await TestModule.save()
        }

		return res.status(201).json({
			message: 'Question added successfully',
			data: newQuestion,
		})
	} catch (error) {
        console.log(error);
		return res.status(500).json({ message: 'Internal server error', error })
	}
}

/** GET: http://localhost:8080/api/gettestquestions NOT IN USE RN*/  
export async function getTestQuestions(req, res) {
	try {
		TestModuleModel.find({ }).populate('questions')
			.exec()
			.then((questions) => {
				let extractedData = questions.map(questionSet => {
					let { _id, module_name, module_description, questions } = questionSet;
					let processedQuestions = questions.map(({ _id, question, options, __v, maxMarks }) => ({ _id, question, options, __v, maxMarks }));
					return { _id, module_name, module_description, questions: processedQuestions };
				})
				return res.status(200).send({ success: true, data: extractedData })
			})
			.catch((err) => {
				return res.status(404).send({ error: 'Cannot Find questions Data', err })
			})
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
	}
}

/** GET: http://localhost:8080/api/getmodulequestions?module_id=6620c1a48cb4bcb50f84748f&index=1 
* @param: {
    "header" : "User <token>"
}
*/ 
export async function getModuleQuestions(req, res) {
    function shuffleArray(array) {
        const shuffledIds = array.map(item => item._id);
        for (let i = shuffledIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
        }
        return shuffledIds.map(id => ({ "question": id }));
    }    

    try {
        const { userID } = req.user;
        const { module_id, index } = req.query;

        if (!module_id) {
            return res.status(500).send({ success: false, message: 'module_id required.' });
        }
        
        if (!index) {
            return res.status(500).send({ success: false, message: 'index required.' });
        }

        let Usertestreport = await UsertestreportModel.findOne({ user: userID, module: module_id }).populate('generatedQustionSet.question');
        if (!Usertestreport) {
            Usertestreport = new UsertestreportModel({ user: userID, module: module_id, generatedQustionSet: [] }); // Change {} to []
        }

        let questions = await TestModuleModel.findOne({ _id: module_id }).populate('questions');
        let QuestionsData = questions.questions.map((question) => {
            const { answer, ...rest } = question.toObject();
            return rest;
        });

        if (!Usertestreport.generatedQustionSet.length) { // Check for array length instead of existence
            // console.log(shuffleArray(QuestionsData));
            Usertestreport.generatedQustionSet = shuffleArray(QuestionsData);
            await Usertestreport.save(); // Save the document after setting the generatedQustionSet
        }

        const fetchAgain = await UsertestreportModel.findOne({ user: userID, module: module_id }).populate('generatedQustionSet.question').populate('module')
        const data = fetchAgain.generatedQustionSet.map((data)=> {
            const {question, ...rest} = data.toObject()
            const {answer, ...restdata} = question
            return({module: fetchAgain.module.module_name, ...rest, question:restdata,});
        })

        // if (index) {
        return res.status(200).send({ success: data[index - 1] ? true : false, length: data.length, data: data[index - 1] ? data[index - 1] : `Max index = ${data.length}` });
        // } else {
        //     return res.status(200).send({ success: true, data: data });
        // }
    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error', error });
    }
}

/** PUT: http://localhost:8080/api/submittestanswer
 * @param: {
    "header" : "User <token>"
}
 * @body : {
    "moduleID": { type: mongoose.Schema.Types.ObjectId, ref: 'Qnas' }
    "questionID": { type: mongoose.Schema.Types.ObjectId, ref: 'Qnas' },
    "answer": { type: String }
}
*/
export async function submitAnswer(req, res) {
    try {
        const { userID } = req.user;
        const { questionID, moduleID, answer } = req.body;
        // Find the user's test report based on userID and moduleID
        const testReport = await UsertestreportModel.findOne({ user: userID, module: moduleID });

        if (!testReport) {
            return res.status(404).send({ success: false, message: 'Test report not found' })
        }

        // Find the index of the question in the generatedQustionSet array
        const questionIndex = testReport.generatedQustionSet.findIndex(item => item.question.toString() === questionID);

        if (questionIndex === -1) {
            return res.status(404).send({ success: false, message: 'Question not found in the generated question set' })
        }

        // Check if the answer for this question is already submitted
        if (testReport.generatedQustionSet[questionIndex].isSubmitted) {
            return res.status(500).send({ success: false, message: 'Answer for this question is already submitted' })
        }

        // Update the submitted answer for the question
        testReport.generatedQustionSet[questionIndex].submittedAnswer = answer;
        testReport.generatedQustionSet[questionIndex].isSubmitted = true; // Optionally, mark the question as submitted

        // Save the updated test report
        await testReport.save();
        return res.status(200).send({ success: true, message: 'Answer submitted successfully' })
    } catch (error) {
        return res.status(501).send({ success: false, message: 'Error submitting answer' + error.message })
    }
}

/** GET http://localhost:8080/api/testsubmitteduserslist  */
export async function testSubmittedUsersList(req, res) {
    try {
        const completedReports = await UsertestreportModel.find({}).populate('user', 'name phone').exec();

        const userData = {};

        completedReports.forEach(report => {
            const userId = report.user._id.toString();

            if (!userData[userId]) {
                userData[userId] = {
                    name: report.user.name,
                    phone: hidePhone(report.user.phone),
                    allModulesCompleted: true
                };
            }

            if (!report.isModuleCompleted) {
                userData[userId].allModulesCompleted = false;
            }
        });

        const uniqueUsers = Object.values(userData).filter(user => user.allModulesCompleted);

        return res.status(200).send({ success: true, data: uniqueUsers });
    } catch (error) {
        return res.status(501).send({ success: false, message: 'Error fetching completed users: ' + error.message });
    }
}
function hidePhone(phone) {
    phone = phone.toString()
    if (phone && phone.length >= 10) {
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
    }
    return phone;
}

/** PUT: http://localhost:8080/api/updatedQuestionViaCSV
 * @param: {
    "header" : "User <token>"
}
 * @body : {
    "moduleID": { type: mongoose.Schema.Types.ObjectId, ref: 'Qnas' }
    "questionID": { type: mongoose.Schema.Types.ObjectId, ref: 'Qnas' },
    "answer": { type: String }
}
*/
export async function updatedQuestionViaCSV(req, res) {
    
}

/** POST: http://localhost:8080/api/addquestionstomodule
* @param: {
    "header" : "Admin <token>"
}
body: {
    "module_id":"6620b6b7a3340a8de1a70bc0",
    "questions": "file.csv"
}
*/

// Ensure the uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

export const upload = multer({ storage: storage, fileFilter: fileFilter }).single('questions');

export const addQuestionsFromCSV = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: 'File upload error', error: err.message });
            } else if (err) {
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            let jsonArray = [];
            try {
                if (req.file.mimetype === 'application/vnd.ms-excel' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const workbook = xlsx.readFile(req.file.path);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                } else if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/csv') {
                    jsonArray = await parseCSV(req.file.path); // Helper function to parse CSV
                } else {
                    return res.status(400).json({ message: 'Unsupported file type' });
                }
            } catch (error) {
                return res.status(400).json({ message: 'Error parsing file', error: error.message });
            }

            // Assuming the first row contains headers
            const headers = jsonArray[0];
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
                    const TestModule = await TestModuleModel.findOne({ _id: req.body.module_id });

                    if (!TestModule) {
                        return res.status(404).json({ error: 'Invalid module ID' });
                    }

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
                    TestModule.questions.push(newQuestion._id);
                    await TestModule.save();

                    results.push({ message: 'Question added successfully', data: newQuestion });
                } catch (error) {
                    console.error('Error adding question:', error);
                    return res.status(500).json({ message: 'Error adding question', error: error.message });
                }
            }

            fs.unlinkSync(req.file.path);

            return res.status(201).json(results);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path); // Delete uploaded file
        }
    }
};
