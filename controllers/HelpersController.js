import axios from 'axios';
import CollegesModel from '../model/CollegesData.model.js'
import EnquiryModel from '../model/Enquiry.model.js';
import GroupsModel from '../model/Groups.model.js';
import UserModel from '../model/User.model.js';
import { registerMail } from './mailer.js';
import cron from 'node-cron';
import multer from 'multer';
import path from 'path';
import xlsx from 'xlsx';
import fs from 'fs';
import EducationModel from '../model/Education.model.js';

export async function getColleges(req, res) {
    try {
        const {search} = req.query;
        console.log(search);
        const regex = new RegExp(search, "i");

        const colleges = await CollegesModel.find({ college: regex }).limit(10);
        
        res.json(colleges);
    } catch (err) {
        res.status(500).json({ message: err.message }); // If an error occurs, send a 500 status code along with the error message
    }
}

/** POST: http://localhost:8080/api/maketeacherchatavailable
body: {
    "groupId": "teacherchat",
}
*/
export async function makeTeacherChatAvailable(req, res) {
    try {
        const { groupId } = req.body;
        
        // Check if the group exists
        let group = await GroupsModel.findOne({ groupId });

        if (!group) {
            // Create the group if it does not exist
            group = new GroupsModel({
                groupId,
                isTeacherChatAvailable: true // Set the initial value as true
            });
        } else {
            // If the group exists, just update the isTeacherChatAvailable field
            if(group.isTeacherChatAvailable){
                group.isTeacherChatAvailable = false;
            }
            else{
                group.isTeacherChatAvailable = true;
            }
        }

        await group.save();

        res.json({ success: true, message: "Teacher chat is now available" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error', });
    }
}

/** GET: http://localhost:8080/api/isteacherchatavailable?groupId=teacherchat */
export async function isTeacherChatAvailable(req, res) {
    try {
        const { groupId } = req.query;
        const group = await GroupsModel.findOne({ groupId });

        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isTeacherChatAvailable) {
            return res.json({ success: false, message: "Teacher chat is not available" });
        }

        res.json({ success: true, message: "Teacher chat is available" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}

export async function scheduleAddtoCartMail(name, email, totalMinutes, subject, text, userID, courseId) {
    if (totalMinutes < 1) {
        throw new Error('Minutes must be greater than 0.');
    }

    // Calculate hours and remaining minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Create cron expression based on the calculated hours and minutes
    let cronExpression;
    if (hours > 0) {
        cronExpression = `${minutes} ${hours} * * *`;
    } else {
        cronExpression = `*/${minutes} * * * *`;
    }

    // Schedule the task to run after the specified time
    const job = cron.schedule(cronExpression, async () => {
        try {
            // Find the user by their ID
            const user = await UserModel.findById(userID);

            if (!user) {
                console.log('User not found');
                job.stop();  // Stop the job to ensure it doesn't run again
                return;
            }

            // Check if the user has already purchased the course
            const hasPurchasedCourse = user.purchased_courses.some(
                (purchasedCourse) => purchasedCourse.course.toString() === courseId
            );

            if (hasPurchasedCourse) {
                console.log('User has already purchased the course, not sending mail.');
                job.stop();  // Stop the job if the user has already purchased the course
                return;
            }

            await registerMail({
                body: {
                    username: name,
                    userEmail: email,
                    subject: subject,
                    text: text,
                },
            }, {
                status(status) {
                    if (status === 200) {
                        console.log('Mail sent successfully');
                    } else {
                        console.log('Failed to send mail');
                    }
                },
            });

            // Stop the job after sending the email
            job.stop();
        } catch (error) {
            console.error('Error sending mail:', error);
            job.stop();  // Stop the job in case of an error
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Set your appropriate timezone
    });
}

/** POST: http://localhost:8080/api/sendEnquiry
body: {
    "email": "karyasdfanshul@gmail.com",
    "name": "anshul",
    "number": "7654345672",
    "message": "message to be sent"
}
*/
export async function sendEnquiry(req, res) {
    try {
        const { name, email, number, message } = req.body;

        const enquiry = await EnquiryModel.findOne({ email });
        
        if (enquiry) {
            enquiry.name = name;
            enquiry.number = number;
            enquiry.message = message;
            await enquiry.save();
            return res.status(200).json({ success: true, message: 'Enquiry sent successfully' });
        }

        // If no enquiry exists, create a new one
        const newEnquiry = new EnquiryModel({
            name: name,
            email: email,
            number: number,
            message: message
        });

        await newEnquiry.save();
        res.status(201).json({ success: true, message: 'Enquiry sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/getAllEnquiry */
export async function getAllEnquiry(req, res) {
    try {
        const enquiries = await EnquiryModel.find();
        if(!enquiries){
            res.status(404).json({ success: false, message: 'No enquiries found' });
        }
        res.status(200).json( { success: true, enquiries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}

function convertToWebVTT(transcriptionData) {
    const lines = ['WEBVTT\n']; // WebVTT header
    let currentSecond = null;
    let subtitleText = '';

    transcriptionData.words.forEach((word) => {
        // Convert the word's start time to seconds
        const wordStartSecond = Math.floor(word.start / 1000); // Convert ms to seconds
        const wordEndSecond = Math.floor(word.end / 1000);

        // If we're still in the same second, append the word
        if (wordStartSecond === currentSecond) {
            subtitleText += ` ${word.text}`;
        } else {
            // If the second has changed, write the previous subtitle
            if (currentSecond !== null && subtitleText.trim() !== '') {
                const startTime = new Date(currentSecond * 1000).toISOString().slice(11, -1);
                const endTime = new Date((currentSecond + 1) * 1000).toISOString().slice(11, -1);
                lines.push(`${startTime} --> ${endTime}`);
                lines.push(`${subtitleText.trim()}\n`);
            }

            // Reset for the new second
            currentSecond = wordStartSecond;
            subtitleText = word.text;
        }
    });

    // Handle the last second's subtitle
    if (subtitleText.trim() !== '') {
        const startTime = new Date(currentSecond * 1000).toISOString().slice(11, -1);
        const endTime = new Date((currentSecond + 1) * 1000).toISOString().slice(11, -1);
        lines.push(`${startTime} --> ${endTime}`);
        lines.push(`${subtitleText.trim()}\n`);
    }

    return lines.join('\n');
}


export async function getVideoSubtitles(req, res) {
    try {
        const videoUrl = req.body.videoUrl; // Get video URL from the request body

        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        // Request transcription directly using the provided video URL
        const transcriptRequest = await axios.post(process.env.ASSEMBLYAI_API, {
            audio_url: videoUrl,
        }, {
            headers: {
                'authorization': process.env.ASSEMBLYAI_API_KEY,
            },
        });

        // Wait for the transcription to complete
        let transcriptionResponse;
        do {
            transcriptionResponse = await axios.get(`${process.env.ASSEMBLYAI_API}/${transcriptRequest.data.id}`, {
                headers: {
                    'authorization': process.env.ASSEMBLYAI_API_KEY,
                },
            });
            if (transcriptionResponse.data.status !== 'completed') {
                await new Promise(resolve => setTimeout(resolve, 2500)); // Wait before checking again
            }
        } while (transcriptionResponse.data.status !== 'completed');

        // Convert to WebVTT format
        const webVttData = convertToWebVTT(transcriptionResponse.data);

        console.log(webVttData)
        // Send the transcribed text (subtitles) back to the client
        res.json({ subtitles: webVttData });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}

export async function createEducationField(req, res) {
    try {
        const { collegeUserID } = req.collegeUser;
        const { degree, stream } = req.body;

        if(!degree || !stream){
            return res.status(404).json({ success: false, message: 'degree and stream field required' });
        }

        const existing = await EducationModel.findOne({ collegeuser: collegeUserID, degree: degree });
        if (existing) {
            return res.status(404).json({ success: false, message: 'Degree field already exists' });
        }

        const savedata = await EducationModel.create({
            collegeuser: collegeUserID,
            degree: degree,
            stream: stream
        });
        return res.status(201).json({ success: true, message: 'Degree field created successfully', savedata });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function getAllEducationFields(req, res) {
    try {
        const { collegeUserID } = req.collegeUser
        const fields = await EducationModel.find({ collegeuser: collegeUserID});
        if(!fields){
            return res.status(404).json({ success: false, message: 'No Degree field found' });
        }
        
        return res.status(200).json({ success: true, data: fields })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

export async function deleteEducationField(req, res) {
    try {
        const { degree } = req.body;
        if(!degree){
            return res.status(404).json({ success: false, message: 'degree field required' });
        }

        const deletedata = await EducationModel.deleteOne({ degree });
        if(!deletedata){
            return res.status(404).json({ success: false, message: 'Degree field not found' });
        }

        return res.status(200).json({ success: true, message: 'Degree deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
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

export const upload = multer({ storage: storage, fileFilter: fileFilter }).single('file');

export async function getDataFromExcelFile(req, res) {
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: true, message: 'File upload error', error: err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }

        try {
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
                } else {
                    return res.status(400).json({ success: false, message: 'Unsupported file type' });
                }
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Error parsing file', error: error.message });
            }

            if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid file content' });
            }

            const headers = jsonArray[0];
            const dataRows = jsonArray.slice(1);

            const results = dataRows.map(row => {
                return row.reduce((obj, value, index) => {
                    obj[headers[index]] = value;
                    return obj;
                }, {});
            });

            return res.status(201).json({ success: true, results });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        } finally {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
        }
    });
}

export async function uploadedFileResponse(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).send({ success: false, message: 'No file uploaded' });
        }

        const fileDetails = {
            originalName: file.originalname,
            path: file.location, // If using S3, otherwise use file.path
            mimetype: file.mimetype,
            size: file.size,
        };

        res.status(200).send({ success: true, file: fileDetails });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
}