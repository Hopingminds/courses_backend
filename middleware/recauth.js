import jwt from 'jsonwebtoken';
import 'dotenv/config'
import HirefromusModel from "../model/Hirefromus.model.js";

export default async function Auth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];

        // retrive the rec details fo the logged in rec
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        let {recID} = decodedToken
        let rec = await HirefromusModel.findById(recID)
        if (rec.token === token) {
            req.rec = decodedToken;
            next()
        } else{
            throw new Error("Invalid rec or token");
        }
    } catch (error) {
        res.status(401).json({ error : "Authentication Failed!"})
    }
}