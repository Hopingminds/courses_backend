import aws from 'aws-sdk';
import nodemailer from 'nodemailer';
import 'dotenv/config';

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET, // From IAM
    region: process.env.AWS_REGION, // Replace with your SES region
});

const transporter = nodemailer.createTransport({
    SES: new aws.SES({ apiVersion: '2010-12-01' }),
});

export async function sendEmail(name, email, subject, message) {
    try {
        if(!name || !email || !subject || !message){
            return { success: false, message: 'Missing fields to send email.' };
        }

        let emailMessage = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: subject,
            html: message,
        };

        await transporter.sendMail(emailMessage);
        console.log(name, email, subject);
        
        return { success: true, message: 'Email sent Successfully.' };
    } catch (error) {
        console.log(error.message);
        return { success: false, message: error.message };
    }
}