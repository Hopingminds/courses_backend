import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import otpGenerator from 'otp-generator'
import { registerMail } from './mailer.js'

// middleware for verify user
export async function verifyUser(req, res, next) {
	try {
		const { email } = req.method == 'GET' ? req.query : req.body
		// check the user existance
		let exit = await UserModel.findOne({ email })
		req.userID = exit._id
		if (!exit) return res.status(404).send({ error: "Can't find user!" })
		next()
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/register 
* @param : {
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
		const {password, name, profile, email, college, stream , yearofpass, phone, degree } = req.body

		// check for existing email
		const existEmail = new Promise((resolve, reject) => {
			UserModel.findOne({ email })
				.exec()
				.then((email) => {
					if (email) {
						reject({ error: 'Email already exsists!' })
					} else {
						resolve()
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([existEmail])
			.then(() => {
				if (password) {
					bcrypt
						.hash(password, 10)
						.then((hashedPassword) => {
							const user = new UserModel({
								// username,
								password: hashedPassword,
								profile: profile || '',
								email,
								phone,
								college, 
								stream , 
								degree,
								name,
								yearofpass
							})

							// return save result as a response
							user.save()
								.then((user) =>{
									const token = jwt.sign(
										{
											userID: user._id,
											email: user.email,
											role: user.role,
										},
										process.env.JWT_SECRET,
										{ expiresIn: '24h' }
									)
									
									UserModel.updateOne({ email:user.email }, { token })
									.exec()
									.then(()=>{
										return res.status(201).send({
											msg: 'User Register Successfully',
											email: user.email,
											role: user.role,
											token,
										})
									})
									.catch((error)=>{
										return res.status(200).json({ success: false, message: 'Internal Server Error - Error Saving Token', error});
									})
								}
								)
								.catch((error) =>
									res.status(500).send({ error })
								)
						})
						.catch((error) => {
							return res.status(500).send({
								error: 'Enable to hashed password',
							})
						})
				}
			})
			.catch((error) => {
				return res.status(500).send({ error })
			})
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Internal server error' });
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
							{ expiresIn: '24h' }
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
				return res.status(404).send({ error: 'Email not Found' })
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

		const checkUser = new Promise((resolve, reject) => {
			UserModel.findOne({ email }).populate({
				path: 'purchased_courses.course',
				populate: { path: 'instructor', select: '-token -password' }
			})
				.exec()
				.then((user) => {
					if (!user) {
						reject({ error: "Couldn't Find the User" })
					} else {
						// Remove sensitive information (e.g., password) before resolving the promise
						const { password, token, ...rest } = user.toObject()
						resolve(rest)
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([checkUser])
			.then((userDetails) => {
				return res.status(200).send({userDetails:userDetails[0]})
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})
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