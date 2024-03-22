import UserModel from '../model/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ENV from '../config.js'
import otpGenerator from 'otp-generator'
import CoursesModel from '../model/Courses.model.js'

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
    "username" : "example123",
    "password" : "admin123",
    "email": "example@gmail.com",
	"college": "IKGPTU", 
	"stream": "B.tech ECE" , 
	"yearofpass": 2024
}
*/
export async function register(req, res) {
	try {
		const { username, password, profile, email, college, stream , yearofpass } = req.body

		// check the existing user
		const existUsername = new Promise((resolve, reject) => {
			UserModel.findOne({ username })
				.exec()
				.then((user) => {
					if (user) {
						reject({ error: 'Please use a unique username' })
					} else {
						resolve()
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		// check for existing email
		const existEmail = new Promise((resolve, reject) => {
			UserModel.findOne({ email })
				.exec()
				.then((email) => {
					if (email) {
						reject({ error: 'Please use a unique email' })
					} else {
						resolve()
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([existUsername, existEmail])
			.then(() => {
				if (password) {
					bcrypt
						.hash(password, 10)
						.then((hashedPassword) => {
							const user = new UserModel({
								username,
								password: hashedPassword,
								profile: profile || '',
								email,
								college, 
								stream , 
								yearofpass
							})

							// return save result as a response
							user.save()
								.then((result) =>
									res.status(201).send({
										msg: 'User Register Successfully',
									})
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
		return res.status(500).send(error)
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
								.send({ error: "Don't password" })

						// create jwt token
						const token = jwt.sign(
							{
								userID: user._id,
								email: user.email,
								role: user.role,
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: user.email,
							role: user.role,
							token,
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({ error: 'Password does not match' })
					})
			})
			.catch((error) => {
				return res.status(404).send({ error: 'email not Found' })
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
			UserModel.findOne({ email }).populate('purchased_courses')
				.exec()
				.then((user) => {
					if (!user) {
						reject({ error: "Couldn't Find the User" })
					} else {
						// Remove sensitive information (e.g., password) before resolving the promise
						const { password, ...rest } = user.toObject()
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
    "firstName": "",
    "lastName": "",
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
    res.status(201).send({code:req.app.locals.OTP})
}

/** GET: http://localhost:8080/api/verifyOTP  
 * body:{
	code: 1234,
 * }
*/
export async function verifyOTP(req, res) {
	const {code} = req.query;
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

        const { username, password } = req.body;

        try {
            
            UserModel.findOne({ username})
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ username : user.username },
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
                    return res.status(404).send({ error : "Username not Found"});
                })

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
}

/** POST: http://localhost:8080/api/giveassignement
body: {
    "email": "example@gmail.com",
    "courseid": "65c4ba60866d0d5a6fc4a82b",
	"deadline" : "2024-05-10"
}
*/
export async function giveAssignement(req, res) {
	let userID = req.userID
	try {
        const { courseid, deadline } = req.body;
		
		// Fetch the course data
		const course = await CoursesModel.findById(courseid);
        if (!course) {
            return res.status(404).json({ success: false, message: 'course not found' });
        }

        // Find the user for the user
        let user = await UserModel.findOne({ _id:userID });

        // If the user has no user, create a new one
        if (!user) {
            user = new UserModel({ _id:userID, assignments: [] });
        }
		
		user.assignments.push(
			{
				date: new Date(),
				subject: course._id,
				deadline: deadline,
			}
		);

        await user.save();
        res.status(201).json({success: true, msg: 'Assignement assigned to user successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, msg: 'Internal server error' });
    }
}


/** GET: http://localhost:8080/api/getUserassignements/example@gmail.com */
export async function getUserAssignements(req, res) {
	const { email } = req.params
	
	try {
		if (!email)
			return res.status(501).send({ error: 'Invalid Email' })

		const checkUser = new Promise((resolve, reject) => {
			UserModel.findOne({ email }).populate('assignments.subject')
				.exec()
				.then((user) => {
					if (!user) {
						reject({ error: "Couldn't Find the User" })
					} else {
						// Remove sensitive information (e.g., password) before resolving the promise
						const { password, ...rest } = user.toObject()
						resolve(rest.assignments)
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([checkUser])
			.then((userDetails) => {
				return res.status(200).send({userDetails: userDetails[0]})
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})
	} catch (error) {
		return res.status(404).send({ error: 'Cannot Find User Data' })
	}
}