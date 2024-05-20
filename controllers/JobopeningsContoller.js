import JobopeningsModel from "../model/Jobopenings.model.js";

export async function createJobopening(req, res) {
    try {
        let body = req.body;
        const { recID } = req.rec

        const newJobopening = new JobopeningsModel({...body, publichedBy:recID});
        await newJobopening.save();

        return res.status(201).json({ success: true, message: "Job opening created successfully", jobopening: newJobopening });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function getAllJobOpenings(req, res) {
    try {
        const jobOpenings = await JobopeningsModel.find({ publishStatus: "active" });
        return res.status(200).json({ success: true, jobOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function getAllJobOpeningsRec(req, res) {
    try {
        const { recID } = req.rec
        const jobOpenings = await JobopeningsModel.find({ publichedBy: recID });
        return res.status(200).json({ success: true, jobOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function getOneJobOpeningDeatils(req, res) {
    try {
        const { jobid } = req.params
        const jobOpenings = await JobopeningsModel.findById(jobID);
        return res.status(200).json({ success: true, jobOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function updateJobOpeningStatus(req, res) {
    try {
        const { id, status } = req.body;
        const updatedJobOpening = await JobopeningsModel.findByIdAndUpdate(id, { publishStatus:status }, { new: true });

        if (!updatedJobOpening) {
            return res.status(404).json({ success: false, message: "Job opening not found" });
        }

        return res.status(200).json({ success: true, message: 'job opening publish status updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}