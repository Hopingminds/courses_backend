import jwt from 'jsonwebtoken';
import 'dotenv/config'

export default async function AdminAuth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];
        // retrive the user details fo the logged in user
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        // res.json(decodedToken)
        req.admin = decodedToken;

        next()
    } catch (error) {
        console.log(error);
        res.status(401).json({ error : "Authentication Failed!"})
    }
}