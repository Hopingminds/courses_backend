import JobsApplyModel from "../model/JobsApply.model.js";
import JobopeningsModel from "../model/Jobopenings.model.js";

export async function applyJob(req, res) {
    try {
        let { userID } = req.user
        let { jobID } = req.body

        if (!jobID) {
            return res.status(404).send({ success: false, msg: 'Job is required' })
        }

        let job = await JobopeningsModel.findById(jobID)

        if (!job) {
            return res.status(404).send({ success: false, msg: 'Job not found' })
        }

        if (new Date() > job.lastDate) {
            return res.status(400).send({ success: false, msg: 'Cannot apply after the last date' })
        }

        let isExist = await JobsApplyModel.findOne({
            appliedBy: userID,
            jobApplied: jobID
        })

        if (isExist) {
            return res.status(400).send({ success: false, msg: 'Already Applied!', data: isExist })
        }

        let jobApply = new JobsApplyModel({
            appliedBy: userID,
            jobApplied: jobID
        })

        await jobApply.save()
        return res.status(200).send({ success: true, msg: 'Successfully applied to the job!' })
    } catch (error) {
        return res.status(500).send({ success: false, msg: 'Internal server error', error: error.message });
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