import multer from 'multer'
import csv from 'csv-parser'
import { Readable } from 'stream'
import CollegeUserModel from '../model/CollegeUser.model.js'
import UserModel from '../model/User.model.js'

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
                { $set: { name, phone, degree, stream, college, purchased_courses:coursesAllottedData } },
                { upsert: true, new: true }  // Create if not exists, return new doc
            );
        }
        

        return res.status(201).send({success: true, msg: "Records Created or Updated Successfully!"})
    } catch (error) {
        console.log(error);
        return res.status(501).send({success: false, msg: "Internal Server Error!"})
    }
}