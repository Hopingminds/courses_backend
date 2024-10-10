import FreelanceModel from "../model/Freelance.model.js";
import FreelanceAppliedModel from "../model/FreelanceApplied.model.js";

/** POST: http://localhost:8080/api/createFreelancerOpening 
* @body : {
    "freelanceOpeningData"
}
*/
export async function createFreelancerOpening(req, res) {
    try {
        const body = req.body; // Changed to constant
        const freelanceOpening = new FreelanceModel(body); // Changed variable name

        await freelanceOpening.save();

        return res.status(201).json({ success: true, message: "Freelance opening created successfully", freelanceOpening });
    } catch (error) {
        console.error(error); // Log the error
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** PUT: http://localhost:8080/api/updateaccess 
body: { 
    "freelanceOpeningData"
}
*/
export async function updateFreelancerOpening(req, res) {
    try {
        const { _id } = req.body;
        const updateData = req.body;

        // Find the freelance opening by ID and update with the new data
        const updatedFreelanceOpening = await FreelanceModel.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedFreelanceOpening) {
            return res.status(404).json({ success: false, message: "Freelance opening not found" });
        }

        return res.status(200).json({ success: true, message: 'Freelance opening updated successfully', updatedFreelanceOpening });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getAllFreelanceOpenings */
export async function getAllFreelanceOpenings(req, res) {
    try {
        const freelanceOpenings = await FreelanceModel.find({ publishStatus: "active" }).sort({ publishDate: -1 });

        return res.status(200).json({ success: true, freelanceOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getFreelanceOpening */
export async function getFreelanceOpening(req, res) {
    try {
        const { jobid } = req.query;
        const freelanceOpening = await FreelanceModel.findById(jobid);

        if (!freelanceOpening) {
            return res.status(404).json({ success: false, message: "Job opening not found" });
        }

        return res.status(200).json({ success: true, freelanceOpening });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** PUT: http://localhost:8080/api/updateaccess 
body: { 
    "_id": "FreelanceId",
    "status": "closed" OR "active"
}
*/
export async function changeFreelanceOpeningStatus(req, res) {
    try {
        const { _id, status } = req.body;
        const updatedJobOpening = await FreelanceModel.findByIdAndUpdate(_id, { publishStatus: status }, { new: true });

        if (!updatedJobOpening) {
            return res.status(404).json({ success: false, message: "Job opening not found" });
        }

        return res.status(200).json({ success: true, message: 'Job opening publish status updated', updatedJobOpening });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}
