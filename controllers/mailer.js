import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import 'dotenv/config';

// Configuration for G Suite Gmail
let nodeConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USERNAME,
        serviceClient: process.env.OAUTH_CLIENTID,
        privateKey: process.env.OAUTH_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
};

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Hoping Minds',
        logo: 'https://hoping-minds-courses.s3.ap-south-1.amazonaws.com/assets/1728557604986-hmlogo.png',
        logoHeight: '50px',
        link: 'https://hopingminds.com/',
    },
});

/** POST: http://localhost:8080/api/registerMail 
 * @param: {
    "username" : "example123",
    "userEmail" : "admin123",
    "text" : "",
    "subject" : "",
}
*/
export const registerMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;
    console.log(username, userEmail, subject);
    // body of the email
    var email = {
        body: {
            signature: false,
            greeting: false,
            name: username,
            intro: text || "Welcome. We're very excited to have you on board.",
            outro: ` <p style="font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif; text-align: center; font-size: 14px; color: #000">
                    Need help, or have questions?</br>
                    Just reply to <a href="mailto:support@hopingminds.com">support@hopingminds.com</a> , we'd love to help.
                </p>`,
        },
    };

    var emailBody = MailGenerator.generate(email);

    let message = {
        from: process.env.EMAIL_USERNAME,
        to: userEmail,
        subject: subject || 'Signup Successful',
        html: emailBody,
    };

    // send mail
    try {
        await transporter.sendMail(message);
        return res.status(200)
    } catch (error) {
        console.error(error);
        return res.status(500)
    }
};