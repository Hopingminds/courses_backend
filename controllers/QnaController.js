import QnaModel from "../model/Qna.model.js"
import TestModuleModel from "../model/Testmodule.model.js"

/** POST: http://localhost:8080/api/addquestiontomodule
body: {
    "module_id":"6620b6b7a3340a8de1a70bc0",
    "question": "This is a question",
    "options":{
        "opt_1":"Option 1",
        "opt_2":"Option 2",
        "opt_3":"Option 3",
        "opt_4":"Option 4"
    },
    "answer": 3
}
*/
export async function addQuestionToModule(req, res) {
	try {
		const question = req.body
        console.log(question);
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

/** GET: http://localhost:8080/api/gettestquestions */
export async function getTestQuestions(req, res) {
	try {
		TestModuleModel.find({ }).populate('questions')
			.exec()
			.then((questions) => {
				let extractedData = questions.map(questionSet => {
					let { _id, module_name, module_description, questions } = questionSet;
					let processedQuestions = questions.map(({ _id, question, options, __v }) => ({ _id, question, options, __v }));
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

/** GET: http://localhost:8080/api/getmodulequestions
	@body :{
		module_id: "6620c1a48cb4bcb50f84748f"
	}
 */ 
export async function getModuleQuestions(req, res) {
	try {
		const { module_id } = req.body
		TestModuleModel.findOne({ _id:module_id }).populate('questions')
			.exec()
			.then((questions) => {
				let data  = questions.questions.map((question)=>{
					const { answer, ...rest } = question.toObject()
					return rest
				})
				return res.status(200).send({ success: true, data: data })
			})
			.catch((err) => {
				return res.status(404).send({ error: 'Cannot Find questions Data', err })
			})
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
	}
}