import JobopeningsModel from "../model/Jobopenings.model.js";

export async function createJobopening(req, res) {
    try {
        let body = req.body;

        const newJobopening = new JobopeningsModel(body);

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