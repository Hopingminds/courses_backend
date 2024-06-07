import AssessmentModel from "../model/Assessment.model";

export async function createAssessment(req, res) {
    let body = req.body
    if (!body) {
        return res.status(404).send('Body data cant be empty')
    }
    let assessment_id = Date().getTime()
    body.question.forEach(data => {
        let {
            question,
            options,
            answer,
            maxMarks } = data
        let Assessment = new AssessmentModel({
            assessment_id,
            question,
            options,
            answer,
            maxMarks
        })
        Assessment.save()
    });
}