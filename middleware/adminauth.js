import jwt from 'jsonwebtoken';
import 'dotenv/config'
import AdminModel from "../model/Admin.model.js";

export default async function AdminAuth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];
        // retrive the user details fo the logged in user
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        let {adminID} = decodedToken
        let admin = await AdminModel.findById(adminID)
        if (admin) {
            req.admin = decodedToken;
            next()
        } else{
            throw new Error("Invalid admin or token");
        }

        next()
    } catch (error) {
        res.status(401).json({ error : "Authentication Failed!"})
    }
}