import QnaModel from "../model/Qna.model"

/** POST: http://localhost:8080/api/addquestiontomodule
body: {
    "module_id":"6620b6b7a3340a8de1a70bc0"
    "question": "This is a question",
    "options":{
        1: "Option 1",    
        2: "Option 2",
        3: "Option 3",
        4: "Option 4",
    },
    "answer": {
        3
    }
}
*/
export async function addQuestionToModule(req, res) {
	try {
		const question = req.body

		const newQuestion = new QnaModel(question)
		await newQuestion.save()

		return res.status(201).json({
			message: 'Question added successfully',
			question: newQuestion,
		})
	} catch (error) {
		return res.status(500).json({ error: 'Internal server error' })
	}
}