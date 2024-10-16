import CollegesModel from '../model/CollegesData.model.js'
import EnquiryModel from '../model/Enquiry.model.js';
import GroupsModel from '../model/Groups.model.js';
import UserModel from '../model/User.model.js';
import { registerMail } from './mailer.js';
import cron from 'node-cron';

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
            const user = await UserModel.findById(userID).populate('purchased_courses.course');

            if (!user) {
                console.log('User not found');
                job.stop();  // Stop the job to ensure it doesn't run again
                return;
            }

            // Check if the user has already purchased the course
            const hasPurchasedCourse = user.purchased_courses.some(
                (purchasedCourse) => purchasedCourse.course._id.equals(courseId)
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