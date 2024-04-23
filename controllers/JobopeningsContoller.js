import JobopeningsModel from "../model/Jobopenings.model.js";

export async function createJobopening(req, res) {
    try {
        let { position, company, location, logoUrl } = req.body;
        if (!position || !company || !location || !logoUrl) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newJobopening = new JobopeningsModel({
            position,
            company,
            location
        });

        await newJobopening.save();

        return res.status(201).json({ success: true, message: "Job opening created successfully", jobopening: newJobopening });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export async function getAllJobOpenings(req, res) {
    try {
        const jobOpenings = await JobopeningsModel.find();
        return res.status(200).json({ success: true, jobOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}