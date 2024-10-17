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

/** PUT: http://localhost:8080/api/updateFreelancerOpening 
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
        const freelanceOpenings = await FreelanceModel.find();

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

/** GET: http://localhost:8080/api/getFreelanceByCategory
@query:{
    role_category:"",
    employment_type:"",
    key_skills:"send multiple with comma (,)",
    company:"",
    work_mode:"",
    location:"",
    salaryFrom:"",
    salaryTo:"",
    publishStatus:"",
    publishDate:"",
    lastDate:"",
    isFresher:"",
    experienceFrom:"",
    experienceTo:""
}
 */
export async function getFreelanceByCategory(req, res) {
    try {
        const {
            role_category,
            employment_type,
            key_skills,
            company,
            work_mode,
            location,
            salaryFrom,
            salaryTo,
            publishStatus,
            publishDate,
            lastDate,
            isFresher,
            experienceFrom,
            experienceTo
        } = req.query;

        // Build dynamic query based on available query parameters
        let query = {};

        if (role_category) query.role_category = { $regex: role_category, $options: 'i' }; // Case-insensitive
        if (employment_type) query.employment_type = { $regex: employment_type, $options: 'i' }; // Case-insensitive
        if (key_skills) query.key_skills = { $in: key_skills.split(',').map(skill => new RegExp(skill, 'i')) }; // Case-insensitive for each skill
        if (company) query.company = { $regex: company, $options: 'i' }; // Case-insensitive
        if (work_mode) query.work_mode = { $regex: work_mode, $options: 'i' }; // Case-insensitive
        if (location) query.location = { $regex: location, $options: 'i' }; // Case-insensitive

        // Converting salaryFrom and salaryTo to numbers
        const salaryFromNum = parseFloat(salaryFrom);
        const salaryToNum = parseFloat(salaryTo);

        // Fixing salary range logic
        if (salaryFrom || salaryTo) {
            query['annual_salary_range.from'] = { $gte: salaryFromNum || 0 }; // Ensure the salary is greater than or equal to 'salaryFrom'
            query['annual_salary_range.to'] = { $lte: salaryToNum || 999999999999999 }; // Ensure the salary is less than or equal to 'salaryTo'
        }

        if (publishStatus) query.publishStatus = publishStatus; // Assuming this is exact match
        if (publishDate) query.publishDate = publishDate; // Assuming this is exact match
        if (lastDate) query.lastDate = lastDate; // Assuming this is exact match

        // Handling work experience filtering
        if (isFresher !== undefined) {
            query['work_experience.isFresher'] = (isFresher === 'true'); // Convert string to boolean
        }
        if (experienceFrom || experienceTo) {
            query['work_experience.from'] = { $gte: experienceFrom || 0 };
            query['work_experience.to'] = { $lte: experienceTo || 100 };
        }

        const freelanceOpenings = await FreelanceModel.find(query).sort({ publishDate: -1 });

        return res.status(200).json({ success: true, freelanceOpenings });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

/** DELETE: http://localhost:8080/api/deleteFreelanceJob 
body: { 
    "jobid": "jobid",
}
*/
export async function deleteFreelanceJob(req, res) {
    try {
        const { jobid } = req.body;

        const freelanceOpening = await FreelanceModel.deleteOne({ _id: jobid });

        if (!freelanceOpening) {
            return res.status(404).json({ success: false, message: "Job opening not found" });
        }

        return res.status(200).json({ success: true, message: "Job Deleted Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}