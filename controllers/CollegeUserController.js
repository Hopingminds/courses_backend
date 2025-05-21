import CollegeUserModel from '../model/CollegeUser.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import UserModel from '../model/User.model.js'
import ResultModel from '../model/Result.model.js'
// middleware for verify collegeUser
export async function verifyCollegeUser(req, res, next) {
	try {
		const { email, mobile } = req.method == 'GET' ? req.query : req.body
		// check the collegeUser existance
		if (email && !mobile) {
			let exit = await CollegeUserModel.findOne({ email })
			if (!exit) return res.status(404).send({ error: "Can't find collegeUser!" })
			req.collegeUserID = exit._id
			next()
	}
	
	else if (!email && mobile) {
			let exit = await CollegeUserModel.findOne({ mobile })
			if (!exit) return res.status(404).send({ error: "Can't find collegeUser!" })
			req.collegeUserID = exit._id
			next()	
		}
	} catch (error) {
		return res.status(404).send({ error: 'Authentication Error' })
	}
}

/** POST: http://localhost:8080/api/registercollegeUser 
* @param : {
    "password" : "collegeUser123",
    "email": "example@gmail.com",
    "firstName" : "bill",
    "lastName": "william",
    "mobile": 8009860560,
    "profile": "" (not compuslory)
}
*/
export async function register(req, res) {
    try {
        const { password, email, profile, name, mobile, college, coins, coursesAllotted } = req.body;

        // check for existing mobile number
        const existMobile = CollegeUserModel.findOne({ mobile }).exec();

        // check for existing email
        const existEmail = CollegeUserModel.findOne({ email }).exec();

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
            const collegeUser = new CollegeUserModel({
                password: hashedPassword,
                profile: profile || '',
                email,
                name,
                mobile,
				college,
				coins,
				coursesAllotted
            });

            // Save the collegeUser
            const savedCollegeUser = await collegeUser.save();
			const token = jwt.sign(
				{
					collegeUserID: savedCollegeUser._id,
					email: savedCollegeUser.email,
					mobile: savedCollegeUser.mobile
				},
				process.env.JWT_SECRET,
				{ expiresIn: '7d' }
			)
            // Send response with _id and email
            return res.status(201).send({
                msg: 'CollegeUser Registered Successfully',
                token
            });
        }
    } catch (error) {
		console.log(error);
        return res.status(500).send({ error: 'Internal Server Error' });
    }
}

/** POST: http://localhost:8080/api/loginCollegeUserWithEmail 
* @param : {
    "email" : "example123@mail.com",
    "password" : "collegeUser123",
}
*/
export async function loginWithEmail(req, res) {
	const { email, password } = req.body
	try {
		CollegeUserModel.findOne({ email })
			.then((collegeUser) => {
				bcrypt
					.compare(password, collegeUser.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								collegeUserID: collegeUser._id,
								email: collegeUser.email,
								mobile: collegeUser.mobile
							},
							process.env.JWT_SECRET,
							{ expiresIn: '7d' }
						)
						return res.status(200).send({
							success: true,
							msg: 'Login Successful',
							email: collegeUser.email,
							token,
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({success: false, msg: 'Password does not match' })
					})
			})
			.catch((error) => {
				return res.status(404).send({success: false, msg: 'Email not Found' })
			})
	} catch (error) {
		return res.status(500).send({success: false, msg: 'Internal Server Error!'})
	}
}

/** POST: http://localhost:8080/api/loginCollegeUserWithMobile 
* @param : {
    "mobile" : "1234567890",
    "password" : "collegeUser123",
}
*/
export async function loginWithMobile(req, res) {
	const { mobile, password } = req.body
	try {
		CollegeUserModel.findOne({ mobile })
			.then((collegeUser) => {
				bcrypt
					.compare(password, collegeUser.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								collegeUserID: collegeUser._id,
								email: collegeUser.email,
								mobile: collegeUser.mobile
							},
							process.env.JWT_SECRET,
							{ expiresIn: '7d' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: collegeUser.email,
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

/** GET: http://localhost:8080/api/collegeUser 
	query: {
    --pass only one email or mobile according to reset with mobile or reset with email
    "email": "example@gmail.com",
    "mobile": 8009860560,
}
*/
export async function getCollegeUser(req, res) {
	let collegeUserID = req.collegeUserID
	try {
        const collegeUserData = await CollegeUserModel.findOne({_id:collegeUserID}).populate('coursesAllotted');

        if (!collegeUserData) {
            return res.status(404).json({ success: false, msg: 'CollegeUser not found' });
        }
		
		// Find users with the same college name and exclude password and token fields
        const users = await UserModel.find({ college: collegeUserData.college }).select('-password -token');

        const { password, token, ...collegeUserWithoutSensitiveInfo } = collegeUserData.toObject();

        res.status(200).json({
            success: true,
            data: {
                ...collegeUserWithoutSensitiveInfo,
                users
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

/** GET: http://localhost:8080/api/collegeUsers */
export async function getallCollegeUsers(req, res) {
	try {
        const collegeUserData = await CollegeUserModel.find({}).populate('coursesAllotted');

		// Map college users and find users with the same college name
        const collegeUserDataWithUsers = await Promise.all(
            collegeUserData.map(async (collegeUser) => {
                const { password, ...rest } = collegeUser.toObject();
                const users = await UserModel.find({ college: collegeUser.college }).select('-password -token');

                return {
                    ...rest,
                    users, // Add users who have the same college name
                };
            })
        );

        if (!collegeUserDataWithUsers) {
            return res.status(404).json({ success: false, msg: 'CollegeUser not found' });
        }
        res.status(200).json({ success: true, data:collegeUserDataWithUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, msg: 'Internal server error' });
    }
}

/** PUT: http://localhost:8080/api/updatecollegeUser 
 * @param: {
    "header" : "Bearer <token>"
}
body: { --pass only required fields
    "password" : "collegeUser123",
    "email": "example@gmail.com",
    "firstName" : "bill",
    "lastName": "william",
    "mobile": 8009860560,
    "profile": ""
}
*/
export async function updateCollegeUser(req, res) {
	try {
		const { collegeUserID } = req.collegeUser;
		const body = req.body
		if (!collegeUserID) return res.status(401).send({ error: 'CollegeUser Not Found...!' })

		const updateCollegeUser = new Promise((resolve, reject) => {
			// update the data
			CollegeUserModel.updateOne({ _id: collegeUserID }, body)
            .exec()
            .then(()=>{
                resolve()
            })
            .catch((error)=>{
                throw error
            })
		})
        
        Promise.all([updateCollegeUser])
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

/** PUT: http://localhost:8080/api//updatecollegeUserAdmin/:collegeUserID
 * @param: {
    "header" : "Bearer <Admin token>"
}
body: { --pass only required fields
    "password" : "collegeUser123",
    "email": "example@gmail.com",
    "firstName" : "bill",
    "lastName": "william",
    "mobile": 8009860560,
    "profile": ""
}
*/
export async function updateCollegeUserAdmin(req, res) {
	try {
		const { collegeUserID } = req.params;
		const body = req.body
		if (!collegeUserID) return res.status(401).send({ error: 'CollegeUser Not Found...!' })

		const updateCollegeUser = new Promise((resolve, reject) => {
			// update the data
			CollegeUserModel.updateOne({ _id: collegeUserID }, body)
            .exec()
            .then(()=>{
                resolve()
            })
            .catch((error)=>{
                throw error
            })
		})
        
        Promise.all([updateCollegeUser])
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
            
				CollegeUserModel.findOne({ email })
					.then(collegeUser => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								CollegeUserModel.updateOne({ email : collegeUser.email },
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
            
				CollegeUserModel.findOne({ mobile })
					.then(collegeUser => {
						bcrypt.hash(password, 10)
							.then(hashedPassword => {
								CollegeUserModel.updateOne({ mobile : collegeUser.mobile },
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

/** GET: http://localhost:8080/api/get-college-students?degree=B.Tech&degree=B.Tech&courseAccepted=false&profileComplete=false */
export async function getAllCollegeStudents(req, res) {
	try {
		let { collegeUserID } = req.collegeUser
		let { stream, degree, courseAccepted, profileComplete } = req.query;
		let collegeUser = await CollegeUserModel.findById(collegeUserID);
		
		if (!collegeUser) {
			return res.status(404).send({ success: false, error: "College User Not Found!" });
		}

		let query = { college: collegeUser.college };

		if (stream) {
			if (Array.isArray(stream)) {
				query.stream = { $in: stream };
			} else {
				query.stream = stream;
			}
		}
		
		if (degree) {
			if (Array.isArray(degree)) {
				query.degree = { $in: degree };
			} else {
				query.degree = degree;
			}
		}
		
		if (courseAccepted) {
			query.isCourseOpened = courseAccepted;
		}
		
		if (profileComplete) {
			query.isProfileComplete = profileComplete;
		}
		
		let students = await UserModel.find(query)
			.select('-password -token')
			.populate({
				path: 'purchased_courses.course',
				// populate: {
				// 	path: 'assessments',
				// }
			});

		// Get the list of allotted course IDs from CollegeUser
		let allottedCourses = collegeUser.coursesAllotted.map(course => course.toString());

		// Process each student and filter their purchased courses
		let processedStudents = await Promise.all(students.map(async (student) => {
			let filteredCourses = student.purchased_courses.filter(purchasedCourse =>
				purchasedCourse.course && allottedCourses.includes(purchasedCourse.course._id.toString())
			);

			let updatedCourses = await Promise.all(filteredCourses.map(async (purchasedCourse) => {
				let { _id, title, assessments, curriculum } = purchasedCourse.course;

				// Count total lessons in the course
				let totalLessons = curriculum?.reduce((lessonCount, chapter) => {
					return lessonCount + (chapter.lessons?.length || 0);
				}, 0) || 0;

				// Count completed lessons for this course
				let completedLessons = purchasedCourse.completed_lessons?.length || 0;

				// Count total assessments in the course
				let totalAssessments = assessments?.length || 0;

				// Count completed assessments from ResultModel
				let completedAssessments = await ResultModel.countDocuments({
					userId: student._id,
					assessment_id: { $in: assessments || [] },
					isSubmitted: true
				});

				return {
					course: { _id, title }, // Unpopulated course details
					totalLessons,
					completedLessons,
					totalAssessments,
					completedAssessments
				};
			}));

			return {
				...student.toObject(),
				purchased_courses: updatedCourses
			};
		}));
		return res.status(201).send({ success: true, data: processedStudents, length: processedStudents.length})
	} catch (error) {
		console.log(error);
		return res.status(500).send({success: false, msg: 'Internal Server Error!'})
	}
}

export async function getSingleCollegeStudent(req, res) {
    try {
        let { collegeUserID } = req.collegeUser;
        let { userID } = req.query;

        let collegeUser = await CollegeUserModel.findById(collegeUserID);
        if (!collegeUser) {
            return res.status(404).send({ success: false, error: "College User Not Found!" });
        }

        let student = await UserModel.findOne({ _id: userID, college: collegeUser.college })
            .select('-password -token')
            .populate({
                path: 'purchased_courses.course',
            });

        if (!student) {
            return res.status(404).send({ success: false, error: "Student Not Found!" });
        }

        let allottedCourses = collegeUser.coursesAllotted.map(course => course.toString());
        
        let filteredCourses = student.purchased_courses.filter(purchasedCourse =>
            purchasedCourse.course && allottedCourses.includes(purchasedCourse.course._id.toString())
        );

        let updatedCourses = await Promise.all(filteredCourses.map(async (purchasedCourse) => {
            let { _id, title, assessments, curriculum } = purchasedCourse.course;
            
            let totalLessons = curriculum?.reduce((lessonCount, chapter) => {
                return lessonCount + (chapter.lessons?.length || 0);
            }, 0) || 0;
            
            let completedLessons = purchasedCourse.completed_lessons?.length || 0;
            let totalAssessments = assessments?.length || 0;
            let completedAssessments = await ResultModel.countDocuments({
                userId: student._id,
                assessment_id: { $in: assessments || [] },
                isSubmitted: true
            });

            return {
                course: { _id, title },
                totalLessons,
                completedLessons,
                totalAssessments,
                completedAssessments
            };
        }));

        let processedStudent = {
            ...student.toObject(),
            purchased_courses: updatedCourses
        };

        return res.status(200).send({ success: true, data: processedStudent });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ success: false, msg: 'Internal Server Error!' });
    }
}
