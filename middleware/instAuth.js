import jwt from 'jsonwebtoken';
import 'dotenv/config'
import InstructorModel from '../model/Instructor.model.js';

export default async function instAuth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];

        // retrive the instructor details fo the logged in instructor
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        // res.json(decodedToken)
        let {instructorID} = decodedToken
        let instructor = await InstructorModel.findById(instructorID)
        if (instructor.token === token) {
            req.instructor = decodedToken;
            next()
        } else{
            throw new Error("Invalid instructor or token");
        }
    } catch (error) {
        res.status(401).json({ error : "Authentication Failed!"})
    }
}