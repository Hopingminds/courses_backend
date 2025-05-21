import 'dotenv/config'
import UserModel from '../model/User.model.js';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import OtpModel from '../model/Otp.model.js';

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
        const message = `Dear HMian, Your OTP for login to HopingMinds is ${otp}. OTP is Valid for 10 minutes. Please do not share this OTP. Regards,HopingMinds`;
        const senderid = process.env.SENDER_ID;
        const entityid = process.env.ENTITY_ID;
        const tempid = process.env.TEMP_ID;
        const accusage = 1;

        const url = `http://foxxsms.net/sms/submitsms.jsp?user=HMians&key=${key}&mobile=${number}&message=${message}&senderid=${senderid}&accusage=${accusage}&entityid=${entityid}&tempid=${tempid}`;
        // console.log(url)
        try {
            const response = await axios.get(url);

            // Check if the response indicates success (adjust based on actual API response)
            if (response.data.includes('success')) { // Example check
                const hashedOtp = await bcrypt.hash(otp, 10);

                // Find or create user
                let otpuser = await OtpModel.findOne({ phone: mobileNo });
                if (!otpuser) {
                    otpuser = new OtpModel({ phone: mobileNo });
                }

                // Store hashed OTP and its expiration time
                otpuser.otp = hashedOtp;
                otpuser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
                await otpuser.save();

                return res.status(200).json({ success: true, message: 'OTP sent successfully' });
            } else {
                return res.status(500).json({ success: false, message: 'Invalid mobile number' });
            }
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

        const otpuser = await OtpModel.findOne({ phone: mobileNo });

        if (!otpuser) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        if (otpuser.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired', expiredotp: true });
        }

        const isMatch = await bcrypt.compare(otp, otpuser.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP', validotp: false });
        }

        otpuser.otp = null;
        otpuser.otpExpires = null;
        await otpuser.save();

        await OtpModel.deleteOne({ phone: mobileNo });

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

        const otpuser = await OtpModel.findOne({ phone: mobileNo });

        if (!otpuser) {
            return res.status(400).json({ success: false, message: 'Request for OTP' });
        }

        if (otpuser.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired', expiredotp: true });
        }

        const isMatch = await bcrypt.compare(otp, otpuser.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP', validotp: false });
        }

        otpuser.otp = null;
        otpuser.otpExpires = null;
        await otpuser.save();

        await OtpModel.deleteOne({ phone: mobileNo });

        const token = jwt.sign(
            {
                userID: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await UserModel.updateOne({ phone: mobileNo }, { token });

        return res.status(200).send({
            success: true,
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

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPasswordwithMobile
 * body:{
	mobileNo: "email@emaple.com",
	newPassword: "password"
	otp: "876543"
}
*/
export async function resetPasswordWithMobile(req, res){
    try {
        if(!req.app.locals.resetSession) return res.status(440).send({error : "Session expired!"});

        const {mobileNo, otp, newPassword } = req.body;

        const user = await UserModel.findOne({ phone: mobileNo });
        if (!user) {
            return res.status(404).send({ error: 'User not Found' });
        }
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP has expired'})
        }

        const otpCheck = await bcrypt.compare(otp, user.otp);
        if (!otpCheck) {
            return res.status(400).send({ error: 'OTP does not match' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear OTP and expiration time
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();
        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}