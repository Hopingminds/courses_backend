import jwt from 'jsonwebtoken';
import 'dotenv/config'
import UserModel from '../model/User.model.js';

export default async function Auth(req,res,next) {
    try {
        // access authorize header to validate request
        const token = req.headers.authorization.split(' ')[1];

        // retrive the user details fo the logged in user
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

        // res.json(decodedToken)
        let {userID} = decodedToken
        let user = await UserModel.findById(userID)
        if (user.token === token) {
            req.user = decodedToken;
            next()
        } else{
            throw new Error("Invalid user or token");
        }
    } catch (error) {
        res.status(401).json({ error : "Authentication Failed!"})
    }
}

export function localVariables(req, res, next){
    req.app.locals = {
        OTP : null,
        resetSession : false
    }

    console.log(req.session.reandomQuestions);
    if (!req.session.reandomQuestions) {
        req.session.reandomQuestions = {}
    }

    next()
}