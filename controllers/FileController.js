import multer from 'multer'
import csv from 'csv-parser'
import 'dotenv/config'
import { Readable } from 'stream'
import CollegeUserModel from '../model/CollegeUser.model.js'
import UserModel from '../model/User.model.js'
import { registerMail } from './mailer.js'
import bcrypt from 'bcrypt'
import validator from 'validator';
import EducationModel from '../model/Education.model.js'

const storage = multer.memoryStorage()
const uploadFile = multer({ storage: storage })

/** Custom middleware to handle file upload */
export async function handleFileUpload(req, res, next) {
    uploadFile.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).send('Multer error: ' + err.message)
        } else if (err) {
            return res.status(500).send('Internal Server Error')
        }

        const file = req.file

        if (!file) {
            return res.status(400).send('No file uploaded.')
        }

        const results = []
        const readableStream = new Readable()
        readableStream._read = () => {} // _read is required but you can noop it
        readableStream.push(file.buffer)
        readableStream.push(null)

        readableStream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                req.sheetData = results // Store sheet data in request object
                next()
            })
            .on('error', (err) => {
                return res.status(400).send('Error parsing CSV: ' + err.message)
            })
    })
}

export async function upload(req, res) {
    try {
        let usersData = req.sheetData
        let { collegeUserID } = req.collegeUser
        let { selectedCourses } = req.body;
        selectedCourses = JSON.parse(selectedCourses);

        let { coursesAllotted, used_coins, coins, college } = await CollegeUserModel.findById(collegeUserID)
        
        // Convert ObjectIds in coursesAllotted to string for comparison
        const allottedCourseIds = coursesAllotted.map(course => course.toString());

        // Check if all selected courses are in allotted courses
        const isValidSelection = selectedCourses.every(course => allottedCourseIds.includes(course));

        if (!isValidSelection) {
            return res.status(400).json({ message: "Selected courses are not in allotted courses" });
        }

        let coursesAllottedData = selectedCourses.map((course) => ({
            course: course,
            allotedByCollege: true, // Set allotedByCollege to true for all courses allotted
        }));

        if (usersData.length > (coins - used_coins)) {
            return res.status(500).send({success: false, msg: `Not Enough Coins left to Upload ${usersData.length} users!`})
        }

        let processedEmails = new Set(); // To track processed emails
        let processedPhones = new Set(); // To track processed phone numbers
        let emailErrors = []; // To collect email errors
        let phoneErrors = []; // To collect phone errors
        let duplicateEmails = []; // To collect duplicate email errors
        let duplicatePhones = []; // To collect duplicate phone errors
        let existingCourse = []; // To collect existing Course in user
        let validUsersProcessed = 0; // Counter for valid users processed
        let creditused = 0;

        for (const user of usersData) {
            const { email, name, phone, degree, stream, semester } = user;

            let userHasError = false;

            // Validate email
            if (!validator.isEmail(email)) {
                emailErrors.push({ email, error: 'Invalid email address' });
                userHasError= true;
            }

            // Validate phone number (basic example, you can use more specific patterns)
            const phoneRegex = /^[0-9]{10}$/; // Assuming 10 digit phone numbers
            if (!phoneRegex.test(phone)) {
                phoneErrors.push({ phone, error: 'Invalid phone number' });
                userHasError= true;
            }

            if (processedEmails.has(email)) {
                // Report duplicate email
                duplicateEmails.push({ email, error: 'Duplicate email entry' });
                userHasError= true;
            }

            if (processedPhones.has(phone)) {
                // Report duplicate phone number
                duplicatePhones.push({ phone, error: 'Duplicate phone number entry' });
                userHasError= true;
            }

            if(userHasError){
                continue;
            }

            try {
                const existing = await EducationModel.findOne({ collegeuser: collegeUserID, degree: degree });
                if (existing) {
                    
                    console.log("running");
                    // Add the new stream to the existing degree's stream field
                    const normalizedStream = stream.toLowerCase();
                    if (!existing.stream.map(s => s.toLowerCase()).includes(normalizedStream)) {
                        existing.stream.push(stream);
                    }

                    // Update semester if it's not already present
                    if (!existing.semester.includes(semester)) {
                        existing.semester.push(semester);
                    }

                    await existing.save();

                } else {
                    await EducationModel.create({ collegeuser: collegeUserID, degree, stream: [stream], semester });
                }
            } catch (error) {
                console.error("Error updating education record:", error.message);
            }

            let userDoc = await UserModel.findOne({ email: email });
            let isNewUser = !userDoc;
            let generatedPassword = '';

            if (isNewUser) {
                // Generate a password for new users
                generatedPassword = Math.random().toString(36).slice(-8);

                const hashedPassword = await bcrypt.hash(generatedPassword, 10);
                userDoc = await UserModel.create({
                    email,
                    name,
                    phone,
                    degree,
                    stream,
                    semester,
                    college,
                    isCourseOpened: false,
                    purchased_courses: coursesAllottedData,
                    password: hashedPassword, // Save the generated password
                });

                // Send email to new users
                await registerMail(
                    {
                        body: {
                            username: name,
                            userEmail: email,
                            subject: 'Welcome to My Learnings!',
                            text: `Hey ${name}, some courses have been added to My Learnings at <a href="https://hopingminds.com" target="_blank">hopingminds.com</a> by your college ${college}. 
                            Click the button below to accept these courses.
                            <center>
                                <a href="${`https://api.hopingminds.com/api/acceptCourse/${email}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">Accept Course</button></a>
                            </center>
                            <h6>Note: Use the following password to log in: <strong>${generatedPassword}</strong></h6>
                            <h6>If you are a new user, please <a href="https://hopingminds.com/forgot-password" target="_blank">reset your password</a> as soon as possible.</h6>`,
                        },
                    },
                    {
                        status(status) {
                            if (status === 200) {
                                console.log('Email sent successfully.');
                            } else {
                                console.log('Failed to send email.');
                            }
                        },
                    }
                );
                // creditused+=coursesAllottedData.length;
            } else {
                // Fetch the existing user
                const existingUser = await UserModel.findOne({ email: email });

                if (existingUser) {
                    // Extract course IDs from purchased_courses
                    const existingCourseIds = existingUser.purchased_courses.map(
                        (item) => item.course.toString()
                    );                    

                    // Filter out courses that are not already in purchased_courses
                    const newCourses = coursesAllottedData.filter(
                        (courseData) => !existingCourseIds.includes(courseData.course.toString())
                    );

                    if (newCourses.length > 0) {
                        console.log("running");
                        
                        // Add new courses to purchased_courses
                        const coursesToAdd = newCourses.map((courseData) => ({
                            ...courseData,
                            allotedByCollege: true, // Set any default values if required
                        }));

                        await UserModel.findOneAndUpdate(
                            { email: email },
                            {
                                $set: {
                                    name,
                                    phone,
                                    degree,
                                    stream,
                                    semester,
                                    college,
                                    isCourseOpened: false,
                                },
                                $push: {
                                    purchased_courses: { $each: coursesToAdd },
                                },
                            },
                            { new: true }
                        );
            
                        // Send email to existing users
                        await registerMail(
                            {
                                body: {
                                    username: name,
                                    userEmail: email,
                                    subject: 'Courses Added to Your Account',
                                    text: `Hey ${name}, new courses have been added to your account on <a href="https://hopingminds.com" target="_blank">hopingminds.com</a> by your college ${college}. 
                                    Click the button below to accept these courses.
                                    <center>
                                        <a href="${`https://api.hopingminds.com/api/acceptCourse/${email}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">Accept Course</button></a>
                                    </center>`,
                                },
                            },
                            {
                                status(status) {
                                    if (status === 200) {
                                        console.log('Email sent successfully.');
                                    } else {
                                        console.log('Failed to send email.');
                                    }
                                },
                            }
                        );
                        // creditused+=newCourses.length;
                    } else {
                        // console.log('Already had the courses');
                        
                        existingCourse.push({ email, error: 'Already had the courses' });
                        console.log(existingCourse);
                        
                    }
                }
            }

            processedEmails.add(email); // Track processed emails
            processedPhones.add(phone); // Track processed phone numbers
            validUsersProcessed++;
            creditused++;
        }

        await CollegeUserModel.findByIdAndUpdate(collegeUserID, { used_coins: used_coins + creditused });

        // Return response with errors and summary of valid users processed
        if (emailErrors.length > 0 || phoneErrors.length > 0 || duplicateEmails.length > 0 || duplicatePhones.length > 0 || existingCourse.length > 0) {
            return res.status(400).send({ 
                success: false, 
                msg: `Some users have invalid data or duplicates! (${validUsersProcessed} valid users processed)`, 
                validationError: true,
                emailErrors, 
                phoneErrors, 
                duplicateEmails, 
                existingCourse,
                duplicatePhones 
            });
        }

        return res.status(201).send({ 
            success: true, 
            msg: `Records Created or Updated Successfully! (${validUsersProcessed} valid users processed)` 
        });
    } catch (error) {
        console.log(error);
        return res.status(501).send({success: false, msg: "Internal Server Error!"})
    }
}


export async function acceptCourse(req, res) {
    let { email } = req.params
    await UserModel.findOneAndUpdate(
        { email }, { isCourseOpened:true })
    res.redirect(`${process.env.CLIENT_BASE_URL}/login-2`);
}