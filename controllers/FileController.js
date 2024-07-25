import multer from 'multer'
import csv from 'csv-parser'
import 'dotenv/config'
import { Readable } from 'stream'
import CollegeUserModel from '../model/CollegeUser.model.js'
import UserModel from '../model/User.model.js'
import { registerMail } from './mailer.js'
import bcrypt from 'bcrypt'

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
        let { coursesAllotted, used_coins, coins, college } = await CollegeUserModel.findById(collegeUserID)
        
        let coursesAllottedData = coursesAllotted.map((course) => ({
            course: course._id,
            allotedByCollege: true, // Set allotedByCollege to true for all courses allotted
        }));

        if (usersData.length > (coins - used_coins)) {
            return res.status(500).send({success: false, msg: `Not Enough Coins left to Upload ${usersData.length} users!`})
        }

        await CollegeUserModel.findByIdAndUpdate(collegeUserID, { used_coins: used_coins+usersData.length});
        
        for (const user of usersData) {
            const { email, name, phone, degree, stream } = user;
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
                    college,
                    isCourseOpened: false,
                    purchased_courses: coursesAllottedData,
                    password: hashedPassword, // Save the generated password
                });
            } else {
                // Update existing user
                await UserModel.findOneAndUpdate(
                    { email: email },
                    { $set: { name, phone, degree, stream, college, isCourseOpened: false, purchased_courses: coursesAllottedData } },
                    { new: true }
                );
            }

            // Send email to both new and existing users
            registerMail(
                {
                    body: {
                        username: name,
                        userEmail: email,
                        subject: isNewUser ? 'Welcome to My Learnings!' : 'Courses Added to Your Account',
                        text: isNewUser
                            ? `Hey ${name}, some courses have been added to My Learnings at <a href="https://hopingminds.com" target="_blank">hopingminds.com</a> by your college ${college}. 
                            Click the button below to accept these courses.
                            <center>
                                <a href="${`https://api.hopingminds.com/api/acceptCourse/${email}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">Accept Course</button></a>
                            </center>
                            <h6>Note: Use the following password to log in: <strong>${generatedPassword}</strong></h6>
                            <h6>If you are a new user, please <a href="https://hopingminds.com/forgot-password" target="_blank">reset your password</a> as soon as possible.</h6>`
                            : `Hey ${name}, courses have been added to your account on <a href="https://hopingminds.com" target="_blank">hopingminds.com</a> by your college ${college}. 
                            Click the button below to accept these courses.
                            <center>
                                <a href="${`https://api.hopingminds.com/api/acceptCourse/${email}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">Accept Course</button></a>
                            </center>`,
                    },
                },
                {
                    status(status) {
                        if (status === 200) {
                        } else {
                        }
                    },
                }
            )
        }
        

        return res.status(201).send({success: true, msg: "Records Created or Updated Successfully!"})
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