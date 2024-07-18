import 'dotenv/config'
import UserModel from '../model/User.model.js';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const generateOtp = () => {
    // Function to generate a random 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/** POST: http://localhost:8080/api/sendmobileotp
 * @body {
 *  "mobileNo": "8765445678"
 * }
 */
export async function generateOtpForMobile(req, res){
    try {
        const { mobileNo } = req.body;

        const key = process.env.OTP_KEY;
        const otp = generateOtp();
        const number = `${mobileNo}`;
        const message = `Dear HMian,\n Your OTP for login to HopingMinds is ${otp}. OTP is Valid for 10 minutes. Please do not share this OTP.\n Regards,\nHopingMinds`;
        const senderid = process.env.SENDER_ID;
        const entityid = process.env.ENTITY_ID;
        const tempid = process.env.TEMP_ID;
        const accusage = 1;

        const url = `http://foxxsms.net/sms/submitsms.jsp?user=HMians&key=${key}&mobile=${number}&message=${message}&senderid=${senderid}&accusage=${accusage}&entityid=${entityid}&tempid=${tempid}`;

        try {
            const response = await axios.get(url);

            const hashedOtp = await bcrypt.hash(otp, 10);

            // Find or create user
            let user = await UserModel.findOne({ phone: mobileNo });
            if (!user) {
                user = new UserModel({ phone: mobileNo });
            }

            // Store hashed OTP and its expiration time
            user.otp = hashedOtp;
            user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
            await user.save();

            res.status(200).json({ success: true, message: 'OTP sent successfully', data: response.data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
        }
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}


/** POST: http://localhost:8080/api/verfiynumberotp
 * @body {
 *  "mobileNo": "8765445678",
 *  "otp": "876543",
 * }
 */
export async function verifyOtp(req, res) {
    try {
        const { mobileNo, otp } = req.body;

        const user = await UserModel.findOne({ phone: mobileNo });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Error in verifying OTP:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}


/** POST: http://localhost:8080/api/loginwithotp
 * @body {
 *  "mobileNo": "8765445678",
 *  "otp": "876543",
 * }
 */
export async function loginWithOtp(req, res){
    try {
        const { mobileNo, otp } = req.body;
        const user = await UserModel.findOne({ phone: mobileNo });

        if (!user) {
            return res.status(404).send({ error: 'User not Found' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        const otpCheck = await bcrypt.compare(otp, user.otp);

        if (!otpCheck) {
            return res.status(400).send({ error: 'OTP does not match' });
        }

        const token = jwt.sign(
            {
                userID: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await UserModel.updateOne({ mobileNo }, { token });

        return res.status(200).send({
            msg: 'Login Successful',
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
}