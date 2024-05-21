import multer from 'multer'
import csv from 'csv-parser'
import 'dotenv/config'
import { Readable } from 'stream'
import CollegeUserModel from '../model/CollegeUser.model.js'
import UserModel from '../model/User.model.js'
import { registerMail } from './mailer.js'

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
        
        let coursesAllottedData = coursesAllotted.map((course)=>{
            return { course: course };
        })

        if (usersData.length > (coins - used_coins)) {
            return res.status(500).send({success: false, msg: `Not Enough Coins left to Upload ${usersData.length} users!`})
        }

        await CollegeUserModel.findByIdAndUpdate(collegeUserID, { used_coins: used_coins+usersData.length});
        
        for (const user of usersData) {
            const { email, name, phone, degree, stream } = user;
            await UserModel.findOneAndUpdate(
                { email: email },
                { $set: { name, phone, degree, stream, college, isCourseOpened:false, purchased_courses:coursesAllottedData } },
                { upsert: true, new: true }  // Create if not exists, return new doc
            );

            registerMail(
                {
                    body: {
                        username: name ,
                        userEmail: email,
                        subject: 'Congratulations! You Got a New Courses.',
                        text: `Hey ${name} some courses has been added to My Learnings at <a href="https://hopingminds.in" target="_blank">hopingminds.in</a> by your college ${college}. 
                        Click the below button to accept all those courses.
                        <center>
                            <a href="${`https://api.hopingminds.in/api/acceptCourse/${email}`}" target="_blank"><button style="background-color:#1DBF73;cursor:pointer;">Accept Course</button></a>
                        </center>
                        <h6>Note: If you are a new user you need to <a href="https://hopingminds.in/forgot-password" target="_blank">reset password</a>.</h6>
                        `,
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
    res.redirect(`${process.env.CLIENT_BASE_URL}/login`);
}