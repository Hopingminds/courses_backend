import InstructorModel from '../model/Instructor.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ENV from '../config.js'
import otpGenerator from 'otp-generator'

// middleware for verify instructor
export async function verifyInstructor(req, res, next) {
	try {
		const { email } = req.method == 'GET' ? req.query : req.body
		// check the instructor existance
		let exit = await InstructorModel.findOne({ email })
		req.instructorID = exit._id
		if (!exit) return res.status(404).send({ error: "Can't find instructor!" })
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

		// check the existing instructor
		const existUsername = new Promise((resolve, reject) => {
			InstructorModel.findOne({ username })
				.exec()
				.then((instructor) => {
					if (instructor) {
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
			InstructorModel.findOne({ email })
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
							const instructor = new InstructorModel({
								username,
								password: hashedPassword,
								profile: profile || '',
								email,
								college, 
								stream , 
								yearofpass
							})

							// return save result as a response
							instructor.save()
								.then((result) =>
									res.status(201).send({
										msg: 'Instructor Register Successfully',
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
    "email" : "example123@gmail.com",
    "password" : "admin123",
}
*/
export async function login(req, res) {
	const { email, password } = req.body
	try {
		InstructorModel.findOne({ email })
			.then((instructor) => {
				bcrypt
					.compare(password, instructor.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Don't password" })

						// create jwt token
						const token = jwt.sign(
							{
								instructorID: instructor._id,
								email: instructor.email,
							},
							ENV.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: instructor.email,
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

/** GET: http://localhost:8080/api/instructor/example123 */
export async function getInstructor(req, res) {
	const { email } = req.params

	try {
		if (!email)
			return res.status(501).send({ error: 'Invalid Email' })

		const checkInstructor = new Promise((resolve, reject) => {
			InstructorModel.findOne({ email }).populate('purchased_courses')
				.exec()
				.then((instructor) => {
					if (!instructor) {
						reject({ error: "Couldn't Find the Instructor" })
					} else {
						// Remove sensitive information (e.g., password) before resolving the promise
						const { password, ...rest } = instructor.toObject()
						resolve(rest)
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([checkInstructor])
			.then((userDetails) => {
				return res.status(200).send(userDetails)
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})
	} catch (error) {
		return res.status(404).send({ error: 'Cannot Find Instructor Data' })
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
export async function updateInstructor(req, res) {
	try {
		const { instructorID } = req.instructor;
		const body = req.body
		if (!instructorID) return res.status(401).send({ error: 'Instructor Not Found...!' })

		const updateInstructor = new Promise((resolve, reject) => {
			// update the data
			InstructorModel.updateOne({ _id: instructorID }, body)
            .exec()
            .then(()=>{
                resolve()
            })
            .catch((error)=>{
                throw error
            })
		})
        
        Promise.all([updateInstructor])
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

// successfully redirect instructor when OTP is valid
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
            
            InstructorModel.findOne({ username})
                .then(instructor => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            InstructorModel.updateOne({ username : instructor.username },
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