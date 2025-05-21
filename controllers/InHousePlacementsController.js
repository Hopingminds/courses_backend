import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import InHousePlacementsModel from "../model/InHousePlacements.model.js";
import InHousePlacementApplicantModel from '../model/InHousePlacementApplicant.model.js';

export async function createAInHousePlacement(req, res) {
    try {
        const body = req.body;
        const InHousePlacement = new InHousePlacementsModel(body);

        await InHousePlacement.save();

        return res.status(201).json({ success: true, message: "In House Placement opening created successfully", InHousePlacement });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Internal server error: \n' + error.message });
    }
}

export async function updateInHousePlacement(req, res) {
    try {
        const { _id } = req.body;
        const updateData = req.body;

        const updatedInHousePlacement = await InHousePlacementsModel.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updatedInHousePlacement) {
            return res.status(404).json({ success: false, message: "In House Placement opening not found" });
        }

        return res.status(200).json({ success: true, message: 'In House Placement opening updated successfully', updatedInHousePlacement });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function getAllInHousePlacement(req, res) {
    try {
        const InHousePlacements = await InHousePlacementsModel.find();
        if(!InHousePlacements){
            return res.status(404).json({ success: false, message: "No In House Placement openings found" });
        }

        return res.status(200).json({ success: true, InHousePlacements });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function getInHousePlacement(req, res) {
    try {
        const { jobid } = req.query;
        if(!jobid){
            return res.status(404).json({ success: false, message: "Job ID is required" });
        }

        const InHousePlacement = await InHousePlacementsModel.findById(jobid);

        if (!InHousePlacement) {
            return res.status(404).json({ success: false, message: "In House Placement opening not found" });
        }

        return res.status(200).json({ success: true, InHousePlacement });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function changeInHousePlacementStatus(req, res) {
    try {
        const { _id, status } = req.body;
        const InHousePlacement = await InHousePlacementsModel.findByIdAndUpdate(_id, { publishStatus: status }, { new: true });

        if (!InHousePlacement) {
            return res.status(404).json({ success: false, message: "In House Placement not found" });
        }

        return res.status(200).json({ success: true, message: 'In House Placement publish status updated', InHousePlacement });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function deleteInHousePlacementJob(req, res) {
    try {
        const { jobid } = req.body;

        const InHousePlacement = await InHousePlacementsModel.deleteOne({ _id: jobid });

        if (!InHousePlacement) {
            return res.status(404).json({ success: false, message: "In House Placement not found" });
        }

        return res.status(200).json({ success: true, message: "In House Placement Deleted Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function getInHousePlacementByCategory(req, res) {
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

        const InHousePlacements = await InHousePlacementsModel.find(query).sort({ publishDate: -1 });

        return res.status(200).json({ success: true, InHousePlacements });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

// Ensure the uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Define upload directory using absolute path
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Define filename (timestamp + original extension)
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files are allowed'), false);
    }
};

export const upload = multer({ storage: storage, fileFilter: fileFilter }).single('applicants');

export async function addApplicantsForInHousePlacement(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: true, message: 'File upload error', error: err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }

        const { jobid } = req.body;

        if (!jobid) {
            return res.status(400).json({ success: false, message: 'jobid is required' });
        }

        try {
            const InHousePlacement = await InHousePlacementsModel.findById(jobid);
            if (!InHousePlacement) {
                return res.status(404).json({ success: false, message: 'In House Placement not found' });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            let jsonArray = [];
            try {
                if (req.file.mimetype === 'application/vnd.ms-excel' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const workbook = xlsx.readFile(req.file.path);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonArray = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                }else {
                    return res.status(400).json({ success: false, message: 'Unsupported file type' });
                }
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Error parsing file', error: error.message });
            }

            if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid file content' });
            }

            const headers = Array.isArray(jsonArray[0]) ? jsonArray[0] : Object.keys(jsonArray[0]);
            const results = [];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            for (let i = 1; i < jsonArray.length; i++) {
                const row = jsonArray[i];
                const email = row[headers.indexOf('email')]?.toLowerCase(); // Convert email to lowercase
                const name = row[headers.indexOf('name')];
                let phone_number = row[headers.indexOf('phone_number')];
                let year_of_passing = row[headers.indexOf('year_of_passing')];

                const rowResult = { row: i + 1, success: false, errors: [] };
                let hasErrors = false;

                // Validate email format
                if (email && !emailRegex.test(email)) {
                    rowResult.errors.push({ success: false, message: 'Invalid email format', email });
                    hasErrors = true;
                }

                // Validate and convert phone_number
                if (!phone_number || isNaN(phone_number) || phone_number.toString().length !== 10) {
                    rowResult.errors.push({ success: false, message: 'Phone number is required, must be a number, and exactly 10 digits' });
                    hasErrors = true;
                } else {
                    phone_number = Number(phone_number); // Convert to Number
                }

                // Validate and convert year_of_passing
                if (!year_of_passing || isNaN(year_of_passing) || year_of_passing.toString().length !== 4) {
                    rowResult.errors.push({ success: false, message: 'Year of passing is required, must be a number, and exactly 4 digits' });
                    hasErrors = true;
                } else {
                    year_of_passing = Number(year_of_passing); // Convert to Number
                }

                // Validate required fields
                if (!name) {
                    rowResult.errors.push({ success: false, message: 'Name is required' });
                    hasErrors = true;
                }

                if (hasErrors) {
                    results.push(rowResult);
                    continue; // Skip this row and continue with the next one
                }


                const applicantsData = {
                    email,
                    name,
                    phone_number,
                    year_of_passing,
                };
                
                try {
                    let newApplicant = await InHousePlacementApplicantModel.findOne({ email });
                    if(!newApplicant){
                        newApplicant = new InHousePlacementApplicantModel({
                            email: applicantsData.email,
                            name: applicantsData.name,
                            phone: applicantsData.phone_number,
                            year_of_passing: applicantsData.year_of_passing,
                        });
                        
                        await newApplicant.save();
                    }


                    InHousePlacement.applicants.push({
                        applicant: newApplicant._id
                    });
                    await InHousePlacement.save();
                    results.push({ success: true, message: 'New Candidate added successfully', row: i + 1, newApplicant });
                } catch (error) {
                    results.push({ success: false, message: 'Error adding New Applicant', error: error.message, row: i + 1 });
                    continue;
                }
            }

            return res.status(201).json({ success: true, results, InHousePlacement });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        } finally {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
        }
    });
}

export async function ApplyForInHousePlacement(req, res) {
    try {
        const { jobid, name, email, phone, year_of_passing } = req.body;

        if (!jobid || !name || !email || !phone || !year_of_passing) {
            return res.status(400).json({ success: false, message: 'jobid, name, email, phone, year_of_passing is required.' });
        }

        // Check if file is uploaded successfully
        if (!req.file || !req.file.location) {
            return res.status(400).json({ success: false, message: 'Resume file is required.' });
        }

        const InHousePlacement = await InHousePlacementsModel.findById(jobid);
        if (!InHousePlacement) {
            return res.status(400).json({ success: false, message: 'In House Placement not found' });
        }

        const applicant = await InHousePlacementApplicantModel.findOne({ email, phone });
        if (!applicant) {
            return res.status(400).json({ success: false, message: 'You are not enrolled for the In House Placements.' });
        }

        const existingApplicant = InHousePlacement.applicants.find((app) => app.applicant.toString() === applicant._id.toString());
        if (!existingApplicant) {
            return res.status(400).json({ success: false, message: 'Applicant not found for this In House Placement.' });
        }

        if (existingApplicant.AppliedForJob) {
            return res.status(400).json({ success: false, message: 'You have already applied' });
        }

        existingApplicant.AppliedForJob = true;
        applicant.resume = req.file.location;

        await applicant.save();
        await InHousePlacement.save();

        return res.status(200).json({ success: true, message: 'Application successfully', InHousePlacement });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}