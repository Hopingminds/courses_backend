import JobsApplyModel from "../model/JobsApply.model.js";

export async function applyJob(req, res) {
    try {
        let { userID } = req.user
        let { jobID } = req.body
        if (!jobID) {
            return res.status(501).send({ success: false, error: 'Job is required' }) 
        }

        let isExsist = await JobsApplyModel.findOne({
            appliedBy: userID,
            jobApplied: jobID
        })

        if (isExsist) {
            return res.status(501).send({ success: false, error: 'Already Applied!', data: isExsist }) 
        }

        let jobApply = new JobsApplyModel({
            appliedBy: userID,
            jobApplied: jobID
        })

        await jobApply.save()
        return res.status(200).send({ success: true, msg: 'Successfully applied to the job!' })
    } catch (error) {
        return res.status(404).send({ success: false, error })
    }
}

export async function getUserApplications(req, res) {
    let { userID } = req.user
    try {
        let jobApplications = await JobsApplyModel.find({
            appliedBy: userID
        }).populate('jobApplied')

        return res.status(200).send({ success: true, data: jobApplications })
    } catch (error) {
        return res.status(404).send({ success: false, error })
    }
}