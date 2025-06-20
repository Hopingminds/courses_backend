import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import otpGenerator from 'otp-generator'
import { registerMail } from './mailer.js'
import AccDeleteReqModel from '../model/AccDeleteReq.model.js'

// middleware for verify user
export async function verifyUser(req, res, next) {
	try {
		const { email } = req.method == 'GET' ? req.query : req.body
		// check the user existance
		let exit = await UserModel.findOne({ email })
		if (!exit) return res.status(404).send({ error: "User doesn't exist" })
		req.userID = exit._id
		next()
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/register 
* @body : {
	"name": "Sahil Kumar"
	"password" : "admin123",
    "email": "example@gmail.com",
    "phone" : 9814740275,
	"college": "IKGPTU", 
	"stream": "B.tech ECE" , 
	"yearofpass": 2024
}
*/
export async function register(req, res) {
	try {
		const { password, name, profile, email, college, stream, yearofpass, phone, degree } = req.body;

		if (!email) {
			return res.status(400).json({ success: false, message: 'Email is required' });
		}

		if (!password) {
			return res.status(400).json({ success: false, message: 'Password is required' });
		}

		// check for existing email
		const existingUser = await UserModel.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ success: false, message: 'Email already exists!' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = new UserModel({
			password: hashedPassword,
			profile: profile || '',
			email,
			phone,
			college,
			stream,
			degree,
			name,
			yearofpass
		});

		// Send registration email
		let mailSent = false;
		registerMail({
            body: {
                username: name,
                userEmail: email,
                subject: `Success! You’re Registered with Hoping Minds – Here’s What Comes Next`,
                text: `<a href='https://hopingminds.com'><img src='https://hoping-minds.s3.ap-south-1.amazonaws.com/assets/1728557884988-visit_website.jpg'/></a>`,
            },
			}, {
				status(status) {
					if (status === 200) {
						mailSent = true;
					} else {
						mailSent = false;
					}
				},
			});

		if (mailSent) {
			// Save user to the database
			const savedUser = await user.save();

			// Generate token
			const token = jwt.sign(
				{
					userID: savedUser._id,
					email: savedUser.email,
					role: savedUser.role,
				},
				process.env.JWT_SECRET,
				{ expiresIn: '7d' }
			);

			// Update user with token
			await UserModel.updateOne({ email: savedUser.email }, { token });

			return res.status(201).json({
				msg: 'User Registered Successfully',
				email: savedUser.email,
				role: savedUser.role,
				token,
			});
		} else {
			return res.status(500).json({ success: false, message: 'Failed to send registration email' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** POST: http://localhost:8080/api/login 
* @param : {
    "username" : "example123",
    "password" : "admin123",
}
*/
export async function login(req, res) {
	const { email, password } = req.body
	try {
		UserModel.findOne({ email })
			.then((user) => {
				bcrypt
					.compare(password, user.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Password does not match" })

						// create jwt token
						const token = jwt.sign(
							{
								userID: user._id,
								email: user.email,
								role: user.role,
							},
							process.env.JWT_SECRET,
							{ expiresIn: '7d' }
						)
						
						UserModel.updateOne({ email }, { token })
						.exec()
						.then(()=>{
							return res.status(200).send({
								msg: 'Login Successful',
								email: user.email,
								role: user.role,
								token,
							})
						})
						.catch((error)=>{
							return res.status(500).json({ success: false, message: 'Internal Server Error - Error Saving Token', error});
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({ error: 'Password does not match' })
					})
			})
			.catch((error) => {
				return res.status(401).send({ error: 'Email not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}

/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
	const { email } = req.params

	try {
		if (!email)
			return res.status(501).send({ error: 'Invalid Email' })

		// Find the user by email and populate purchased_courses and instructor details
        const user = await UserModel.findOne({ email }).populate({
            path: 'purchased_courses.course',
            populate: { path: 'instructor', select: '-token -password' }
        }).populate({ path: 'purchased_internships.internship' }).exec();

        if (!user) {
            return res.status(404).send({ error: "Couldn't Find the User" });
        }

        // Calculate total lessons for each course
        const updatedPurchasedCourses = user.purchased_courses
            .filter(purchasedCourse => purchasedCourse.course) // Only include courses that exist
            .map(purchasedCourse => {
                const course = purchasedCourse.course;

                const totalLessons = course.curriculum.reduce((total, chapter) => {
                    return total + chapter.lessons.length;
                }, 0);

                course.total_lessons = totalLessons;

                return purchasedCourse.toObject();
            });

        // Remove sensitive information
        const { password, token, ...rest } = user.toObject();
        
        // Add the updated purchased courses to the user details
        const userDetails = {
            ...rest,
            purchased_courses: updatedPurchasedCourses
        };

		return res.status(200).send({ userDetails });
	} catch (error) {
		return res.status(404).send({ error: 'Cannot Find User Data' })
	}
}

/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
    "header" : "<token>"
}
body: {
    "username" : "",
    
    "email": "",
    "name": "",
    "profile": "",
    "college": "",
    "position": "",
    "bio": "",
}
*/
export async function updateUser(req, res) {
	try {
		const { userID } = req.user;
		const body = req.body
		if (!userID) return res.status(401).send({ error: 'User Not Found...!' })

		const updateUser = new Promise((resolve, reject) => {
			// update the data
			UserModel.updateOne({ _id: userID }, body)
            .exec()
            .then(()=>{
                resolve()
            })
            .catch((error)=>{
                throw error
            })
		})
        
        Promise.all([updateUser])
        .then(()=>{
            return res.status(201).send({ msg : "Record Updated"});
        })
        .catch((error) => {
            return res.status(500).send({ error: error.message })
        })

	} catch (error) {
		return res.status(401).send({ error })
	}
}

/** GET: http://localhost:8080/api/generateOTP 
 * body:{
	email: "email@example.com",
 * }
*/
export async function generateOTP(req, res) {
	req.app.locals.OTP = await otpGenerator.generate(6, {lowerCaseAlphabets: false, upperCaseAlphabets:false, specialChars:false})
    let userID = req.userID
	let data = await UserModel.findOne({ _id: userID })
	registerMail(
		{
			body: {
				username: data.username ,
				userEmail: data.email,
				subject: 'Forgot Password - OTP',
				text: `You one time OTP is ${req.app.locals.OTP}`,
			},
		},
		{
			status(status) {
				if (status === 200) {
					return res.status(200).json({
						success: true,
						msg: 'OTP mail sent',
					})
				} else {
					return res.status(500).json({
						success: false,
						msg: 'OTP mail not sent',
						mail:  data.email,
					})
				}
			},
		}
	)
}

/** GET: http://localhost:8080/api/verifyOTP  
 * body:{
	code: 1234,
 * }
*/
export async function verifyOTP(req, res) {
	const {code} = req.query;
	console.log(code, req.app.locals.OTP);
    if(parseInt(req.app.locals.OTP)=== parseInt(code)){
        req.app.locals.OTP = null //reset OTP value
        req.app.locals.resetSession = true // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!'})
    }
    return res.status(400).send({ error: "Invalid OTP"});
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
	if(req.app.locals.resetSession){
        return res.status(201).send({ flag : req.app.locals.resetSession})
    }
    return res.status(440).send({error : "Session expired!"})
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword 
 * body:{
	email: "email@emaple.com",
	password: "password"
}
*/
export async function resetPassword(req,res){
    try {
        
        if(!req.app.locals.resetSession) return res.status(440).send({error : "Session expired!"});

        const { email, password } = req.body;

        try {
            
            UserModel.findOne({ email})
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ email : user.email },
                            { password: hashedPassword})
                            .exec()
                            .then(()=>{
                                req.app.locals.resetSession = false; // reset session
                                return res.status(201).send({ msg : "Record Updated...!"})
                            })
                            .catch((error)=>{
                                throw error;
                            })
                        })
                        .catch( e => {
                            return res.status(500).send({
                                error : "Enable to hashed password"
                            })
                        })
                })
                .catch(error => {
                    return res.status(404).send({ error : "Email not Found"});
                })

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
}

/** POST: http://localhost:8080/api/validatevalues 
 * @body {
 * 	"email": "example@gmail.com",
 * 	"phone": 8765434544
 * }
*/
export async function validateFields(req, res) {
	try {
		const { email, phone } = req.body;

		if (!email && !phone) {
		return res.status(400).send({ success: false, error: "Email or phone must be provided" });
		}

		const errors = {};

		if (email) {
		const userWithEmail = await UserModel.findOne({ email });
		if (userWithEmail) {
			errors.email = "Email already exists";
		}
		}

		if (phone) {
		const userWithPhone = await UserModel.findOne({ phone });
		if (userWithPhone) {
			errors.phone = "Phone already exists";
		}
		}

		if (Object.keys(errors).length > 0) {
		return res.status(409).send({ success: false, errors });
		}

		return res.status(200).send({ success: true, msg: "Email and phone are available" });
	} catch (error) {
		return res.status(500).send({ msg: "Internal Server Error!" });
	}
}

/** GET: http://localhost:8080/api/generateemailloginOTP?email=example@gmail.com */
export async function getEmailLoginOTP(req, res) {
	req.app.locals.OTP = await otpGenerator.generate(6, {lowerCaseAlphabets: false, upperCaseAlphabets:false, specialChars:false})
    let userID = req.userID
	let data = await UserModel.findOne({ _id: userID })
	registerMail(
		{
			body: {
				username: data.username ,
				userEmail: data.email,
				subject: 'Login With Email - OTP',
				text: `You one time OTP is ${req.app.locals.OTP}`,
			},
		},
		{
			status(status) {
				if (status === 200) {
					return res.status(200).json({
						success: true,
						msg: 'OTP mail sent',
					})
				} else {
					return res.status(500).json({
						success: false,
						msg: 'OTP mail not sent',
						mail:  data.email,
					})
				}
			},
		}
	)
}

/** GET: http://localhost:8080/api/verifyemailOTP?email=anshulkaryal5349@gmail.com&code=387462 */
export async function verifyEmailOTP(req, res) {
	try {
		const { code, email} = req.query;
		const user = await UserModel.findOne({ email });
		
		if (!user) {
			return res.status(404).send({ error: 'User not Found' });
		}
		if(parseInt(req.app.locals.OTP)!== parseInt(code)){
			return res.status(400).send({ error: "Invalid OTP"});
		}
		// Reset OTP and initialize session
		req.app.locals.OTP = null;
		req.app.locals.resetSession = true;

		// Generate JWT token
		const token = jwt.sign(
			{
				userID: user._id,
				email: user.email,
				role: user.role,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '7d' }
		);

		// Update user document with token
		await UserModel.updateOne({ email }, { token });

		// Respond with success
		return res.status(200).json({
			message: 'Login Successful',
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

/** DELETE: http://localhost:8080/api/deleteAccount */
export async function deleteAccount(req, res) {
	try {
		const { userID } = req.user;

		// Create or find a deletion request
		let usertodelete = await AccDeleteReqModel.findOne({ user: userID });

		if (!usertodelete) {
			usertodelete = new AccDeleteReqModel({ user: userID, requestCancelled: false });
			await usertodelete.save();
		}
		else if(usertodelete && !usertodelete.requestCancelled){
			return res.status(400).json({ success: false, message: 'Request has already made' });
		}
		else if(usertodelete && usertodelete.requestCancelled){
			usertodelete.requestCancelled = false;
			await usertodelete.save();
		}

		// Fetch the user data before deletion
		const user = await UserModel.findOne({ _id: userID });

		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}


		// Schedule the account deletion for 24 hours later
		setTimeout(async () => {
			try {
				// Check if the deletion request was canceled before proceeding
				const currentRequest = await AccDeleteReqModel.findOne({ user: userID });

				if (currentRequest && currentRequest.requestCancelled) {
					console.log('Request canceled before deletion');
					
					// Delete the cancellation request from the database
					await AccDeleteReqModel.deleteOne({ user: userID });
					return;
				}

				// Delete the user account
				const result = await UserModel.deleteOne({ _id: userID });
				if (result.deletedCount === 0) {
					console.log('User not found');
					return;
				}

				console.log(`Account for user ${user.name} deleted successfully.`);
			} catch (error) {
				console.error('Error deleting account:', error);
			}
		}, 24 * 60 * 60 * 1000); // 24 * 60 * 60 * 1000 hours in milliseconds

		return res.status(200).json({ success: true, message: 'Account will be deleted in 24 hours' });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}

/** POST: http://localhost:8080/api/cancelAccountDeletion */
export async function cancelAccountDeletion(req, res) {
	try {
		const { userID } = req.user;

		// Find the account deletion request for the user
		const deletionRequest = await AccDeleteReqModel.findOne({ user: userID });

		// If no deletion request exists, respond with an error
		if (!deletionRequest) {
			return res.status(404).json({ success: false, message: 'No account deletion request found' });
		}

		// If the request was already canceled, respond accordingly
		if (deletionRequest.requestCancelled) {
			return res.status(400).json({ success: false, message: 'Deletion request has already been canceled' });
		}

		// Mark the deletion request as canceled
		deletionRequest.requestCancelled = true;
		await deletionRequest.save();

		// Respond with success
		return res.status(200).json({ success: true, message: 'Account deletion request successfully canceled' });
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}