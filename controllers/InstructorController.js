import InstructorModel from '../model/Instructor.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

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

/** POST: http://localhost:8080/api/instregister 
* @param : {
		"password":"Sahil@123", 
		"name": "Sahil Kumar", 
		"profile": "https://dunb17ur4ymx4.cloudfront.net/webstore/logos/badc87621293f70727079411fcd552fae001b939.png", 
		"email": "sahilkumar142002@gmail.com", 
		"experience": "3 Years", 
		"social_links": [
			{
			"website_name": "LinkedIn",
			"profile_url": "https://www.linkedin.com/in/secret-sahil/"
			},
			{
			"website_name": "Website",
			"profile_url": "https://mrsahil.in"
			}
			], 
		"phone": 9814740275, 
		"bio" : "A developer with innovative ideas 💡"
	}
*/
export async function register(req, res) {
	try {
		const {password, name, profile, email, experience, social_links, phone, bio } = req.body

		// check for existing email
		const existEmail = new Promise((resolve, reject) => {
			InstructorModel.findOne({ email })
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
							const instructor = new InstructorModel({
								// instructorname,
								password: hashedPassword,
								profile: profile || '',
								name, email, experience, social_links, phone, bio
							})

							// return save result as a response
							instructor.save()
								.then((instructor) =>{
									const token = jwt.sign(
										{
											instructorID: instructor._id,
											email: instructor.email,
											role: instructor.role,
										},
										process.env.JWT_SECRET,
										{ expiresIn: '24h' }
									)
									
									InstructorModel.updateOne({ email:instructor.email }, { token })
									.exec()
									.then(()=>{
										return res.status(201).send({
											msg: 'Instructor Register Successfully',
											email: instructor.email,
											role: instructor.role,
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

/** POST: http://localhost:8080/api/instlogin 
* @param : {
    "email" : "sahilkumar142002@gmail.com",
    "password" : "Sahil@123"
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
								.send({ error: "Password does not match" })

						// create jwt token
						const token = jwt.sign(
							{
								instructorID: instructor._id,
								email: instructor.email,
								role: instructor.role,
							},
							process.env.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						
						InstructorModel.updateOne({ email }, { token })
						.exec()
						.then(()=>{
							return res.status(200).send({
								msg: 'Login Successful',
								email: instructor.email,
								role: instructor.role,
								token,
							})
						})
						.catch((error)=>{
							return res.status(200).json({ success: false, message: 'Internal Server Error - Error Saving Token', error});
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

/** GET: http://localhost:8080/api/instructor/example123 */
export async function getInstructor(req, res) {
	const { email } = req.params

	try {
		if (!email)
			return res.status(501).send({ error: 'Invalid Email' })

		const checkInstructor = new Promise((resolve, reject) => {
			InstructorModel.findOne({ email })
				.exec()
				.then((instructor) => {
					if (!instructor) {
						reject({ error: "Couldn't Find the Instructor" })
					} else {
						// Remove sensitive information (e.g., password) before resolving the promise
						const { password, token, ...rest } = instructor.toObject()
						resolve(rest)
					}
				})
				.catch((err) => {
					reject(new Error(err))
				})
		})

		Promise.all([checkInstructor])
			.then((instructorDetails) => {
				return res.status(200).send({instructorDetails:instructorDetails[0]})
			})
			.catch((error) => {
				return res.status(500).send({ error: error.message })
			})
	} catch (error) {
		return res.status(404).send({ error: 'Cannot Find Instructor Data' })
	}
}

/** PUT: http://localhost:8080/api/updateinstructor 
 * @param: {
    "header" : "<token>"
}
body: {
    "instructorname" : "",
    
    "email": "",
    "name": "",
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
            
            InstructorModel.findOne({ email})
                .then(instructor => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            InstructorModel.updateOne({ email : instructor.email },
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