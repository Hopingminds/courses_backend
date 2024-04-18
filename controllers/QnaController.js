import QnaModel from "../model/Qna.model.js"
import TestModuleModel from "../model/TestModule.model.js"

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