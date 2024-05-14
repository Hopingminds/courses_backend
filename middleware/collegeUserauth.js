import jwt from 'jsonwebtoken';
import 'dotenv/config'
import CollegeUserModel from "../model/CollegeUser.model.js";

export default async function CollegeUserAuth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];
        // retrive the user details fo the logged in user
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        let {collegeUserID} = decodedToken
        let collegeUser = await CollegeUserModel.findById(collegeUserID)
        if (collegeUser) {
            req.collegeUser = decodedToken;
            next()
        } else{
            throw new Error("Invalid collegeUser or token");
        }
    } catch (error) {
        res.status(401).json({ error : "Authentication Failed!"})
    }
}