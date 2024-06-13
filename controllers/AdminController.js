import AdminModel from '../model/Admin.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import otpGenerator from 'otp-generator'
import UserModel from '../model/User.model.js'
// middleware for verify admin
export async function verifyAdmin(req, res, next) {
	try {
		const { email, mobile } = req.method == 'GET' ? req.query : req.body
		// check the admin existance
		if (email && !mobile) {
			let exit = await AdminModel.findOne({ email })
			if (!exit) return res.status(404).send({ error: "Can't find admin!" })
			req.adminID = exit._id
			next()
	}
	
	else if (!email && mobile) {
			let exit = await AdminModel.findOne({ mobile })
			if (!exit) return res.status(404).send({ error: "Can't find admin!" })
			req.adminID = exit._id
			next()	
		}
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/registeradmin 
* @param : {
    "password" : "admin123",
    "email": "example@gmail.com",
    "firstName" : "bill",
    "lastName": "william",
    "mobile": 8009860560,
    "profile": "" (not compuslory)
}
*/
export async function register(req, res) {
    try {
        const { password, email, profile, firstName, lastName, mobile } = req.body;

        // check for existing mobile number
        const existMobile = AdminModel.findOne({ mobile }).exec();

        // check for existing email
        const existEmail = AdminModel.findOne({ email }).exec();

        // Checking for existing mobile and email
        const [mobileExist, emailExist] = await Promise.all([existMobile, existEmail]);

        if (mobileExist) {
            return res.status(400).send({ error: 'Please use a unique mobile number' });
        }

        if (emailExist) {
            return res.status(400).send({ error: 'Please use a unique email' });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = new AdminModel({
                password: hashedPassword,
                profile: profile || '',
                email,
                firstName, 
				lastName,
                mobile
            });

            // Save the admin
            const savedAdmin = await admin.save();
			const token = jwt.sign(
				{
					adminID: savedAdmin._id,
					email: savedAdmin.email,
					mobile: savedAdmin.mobile
				},
				process.env.JWT_SECRET,
				{ expiresIn: '7d' }
			)
            // Send response with _id and email
            return res.status(201).send({
                msg: 'Admin Registered Successfully',
                token
            });
        }
    } catch (error) {
        return res.status(500).send({ error: 'Internal Server Error' });
    }
}

/** POST: http://localhost:8080/api/loginAdminWithEmail 
* @param : {
    "email" : "example123@mail.com",
    "password" : "admin123",
}
*/
export async function loginWithEmail(req, res) {
	const { email, password } = req.body
	try {
		AdminModel.findOne({ email })
			.then((admin) => {
				bcrypt
					.compare(password, admin.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								adminID: admin._id,
								email: admin.email,
								mobile: admin.mobile
							},
							process.env.JWT_SECRET,
							{ expiresIn: '7d' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: admin.email,
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
				return res.status(404).send({ error: 'Email not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}

/** POST: http://localhost:8080/api/loginAdminWithMobile 
* @param : {
    "mobile" : "1234567890",
    "password" : "admin123",
}
*/
export async function loginWithMobile(req, res) {
	const { mobile, password } = req.body
	try {
		AdminModel.findOne({ mobile })
			.then((admin) => {
				bcrypt
					.compare(password, admin.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								adminID: admin._id,
								email: admin.email,
								mobile: admin.mobile
							},
							process.env.JWT_SECRET,
							{ expiresIn: '7d' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: admin.email,
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
				return res.status(404).send({ error: 'Mobile not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}

/** GET: http://localhost:8080/api/admin 
	query: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
}
*/
export async function getAdmin(req, res) {
	let adminID = req.adminID
	try {
        const adminData = await AdminModel.findOne({_id:adminID});

        if (!adminData) {
            return res.status(404).json({ success: false, msg: 'Admin not found' });
        }
		const { password, ...rest } = adminData.toObject()
        res.status(200).json({ success: true, data:rest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/admins */
export async function getallAdmins(req, res) {
	try {
        const adminData = await AdminModel.find({});
		const adminDataWithoutPassword = adminData.map((admin) => {
			const { password, ...rest } = admin.toObject()
			return rest
		})
        if (!adminDataWithoutPassword) {
            return res.status(404).json({ success: false, msg: 'Admin not found' });
        }
        res.status(200).json({ success: true, data:adminDataWithoutPassword });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

/** PUT: http://localhost:8080/api/updateadmin 
 * @param: {
    "header" : "Bearer <token>"
}
body: { --pass only required fields
    "password" : "admin123",
    "email": "example@gmail.com",
    "firstName" : "bill",
    "lastName": "william",
    "mobile": 8009860560,
    "profile": ""
}
*/
export async function updateAdmin(req, res) {
	try {
		const { adminID } = req.admin;
		const body = req.body
		if (!adminID) return res.status(401).send({ error: 'Admin Not Found...!' })

		const updateAdmin = new Promise((resolve, reject) => {
			// update the data
			AdminModel.updateOne({ _id: adminID }, body)
            .exec()
            .then(()=>{
                resolve()
            })
            .catch((error)=>{
                throw error
            })
		})
        
        Promise.all([updateAdmin])
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
body: { 
	--pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
	"password": "NewPassword"
}
*/
export async function resetPassword(req,res){
    try {
        
        if(!req.app.locals.resetSession) return res.status(440).send({error : "Session expired!"});

        const { mobile, email, password } = req.body;

        if (email && !mobile) {
			try {
            
				AdminModel.findOne({ email })
					.then(admin => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								AdminModel.updateOne({ email : admin.email },
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
		}
		else if (!email && mobile) {
			try {
            
				AdminModel.findOne({ mobile })
					.then(admin => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								AdminModel.updateOne({ mobile : admin.mobile },
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
						return res.status(404).send({ error : "Mobile not Found"});
					})
	
			} catch (error) {
				return res.status(500).send({ error })
			}
		}

    } catch (error) {
        return res.status(401).send({ error })
    }
}

export async function getDashboardData(req, res) {
	try {
		let query = {role: "user"}
		let {university} = req.query
		let enrolled_students = 0
		let enrolled_courses = 0

		if (university) {
			query.college = university
		}

		let users = await UserModel.find(query)
		users.forEach(user => {
			if (user.purchased_courses.length > 0) {
				enrolled_students+=1
				enrolled_courses+= user.purchased_courses.length
			}
		});

		let userData = users.map(user => {
			const { token, password, role, ...rest } = user.toObject();
			return rest;
		});

		return res.status(201).send({ success: true, data:{enrolled_students, enrolled_courses, users: userData}})
	} catch (error) {
		return res.status(401).send({ success: false, msg:'Internal Server Error', error })
	}
}