import InstructorModel from '../model/Instructor.model.js'
import CoursesModel from '../model/Courses.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify'

aws.config.update({
	secretAccessKey: process.env.AWS_ACCESS_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const BUCKET = process.env.AWS_BUCKET
const s3 = new aws.S3();

export const uploadInstructormedia = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            const { instructorID } = req.instructor;
            const newFileName = Date.now() + '-' + file.originalname;
            const fullPath = `instructor/media/${instructorID}/${newFileName}`;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

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
* @header : Bearer <token>
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
		"bio" : ["A developer with innovative ideas 💡","A developer with innovative ideas 💡"],
		"noOfStudents": 24,
		"noOfLessons": 124
	}
*/
export async function register(req, res) {
	try {
		const {password, name, profile, email, experience, social_links, phone, bio, noOfStudents, noOfLessons, experties, workExperience } = req.body

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
								name, email, experience, social_links, phone, bio, noOfStudents, noOfLessons, experties, workExperience
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
										{ expiresIn: '7d' }
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
							{ expiresIn: '7d' }
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

/** GET: http://localhost:8080/api/instructors */
export async function getAllInstructors(req, res) {
	try {
		InstructorModel.find({ })
			.exec()
			.then((instructor) => {
				let data  = instructor.map((ins)=>{
					const { password, token, ...rest } = ins.toObject()
					return rest
				})
					return res.status(200).send({ success: true, data: data })
			})
			.catch((err) => {
				return res.status(404).send({ error: 'Cannot Find Instructor Data', err })
			})
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
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

/** PUT: http://localhost:8080/api/updateinstructoradmin 
 * @param: {
    "header" : "Bearer <Admintoken>"
}
body: {
    "instructorID": "cw76276c8761cv6278"
    "instructorname" : "",
    "email": "",
    "name": "",
    "profile": "",
    "college": "",
    "position": "",
    "bio": "",
}
*/
export async function updateInstructorAdmin(req, res) {
	try {
		const body = req.body
		if (!body.instructorID) return res.status(401).send({ error: 'instructorID is required!' })

		const updateInstructor = new Promise((resolve, reject) => {
			// update the data
			InstructorModel.updateOne({ _id: body.instructorID }, body)
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
/** PUT: http://localhost:8080/api/resetinsPassword 
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

/** POST: http://localhost:8080/api/uploadfiletoaws
    body:{
        file: file.mp4,
		instructorID: "instructorID"
    }
**/
export async function uploadInstMediatoAws(req, res) {
    return res.status(200).json({ 
        success: true, 
        message: 'Successfully Uploaded', 
        url: req.file.location 
    });
}

/** GET: http://localhost:8080/api/getinstfilesfromaws */
export async function getInstFilesFromAws(req, res) {
	const { instructorID } = req.instructor;
    try {
        // List objects in the specified bucket
        const result = await s3.listObjectsV2({ Bucket: BUCKET }).promise();

        // Filter and process objects to include only instructor media
        const mediaFiles = result.Contents.filter(item => item.Key.startsWith(`instructor/media/${instructorID}/`)).map(item => ({
            title: item.Key.replace(/^instructor\/media\/\d+-/, ''),
            key: item.Key,
            url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(item.Key)}`
        }));

        // Return the processed data
        return res.status(200).json({ success: true, mediaFiles });
    } catch (error) {
        console.error("Error retrieving instructor media from S3:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve instructor media." });
    }
}

/** GET: http://localhost:8080/api/instructorcourses */
export const getCoursesByInstructorId = async (req, res) => {
    try {
        const { instructorID } = req.instructor;
        const courses = await CoursesModel.find({ instructor: instructorID }).populate('instructor');
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/** GET: http://localhost:8080/api/instructorupcominglive
 * @header : Bearer <instrucotr>
 */
export async function getUpcomingLiveClasses(req, res) {
    try {
        const { instructorID } = req.instructor;
        const courses = await CoursesModel.find({ instructor: instructorID });

        let upcomingLiveClasses = [];

        courses.forEach(course => {
            course.curriculum.forEach(chapter => {
                chapter.lessons.forEach(lesson => {
                    if (lesson.isLiveClass && new Date(lesson.liveClass.startDate) > new Date()) {
                        upcomingLiveClasses.push({
                            title: course.title,
                            courseID: course._id,
                            chapter_name: chapter.chapter_name,
                            ...lesson.toObject(),
                        });
                    }
                });
            });
        });

        // Sort upcoming live classes by start date
        upcomingLiveClasses.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        res.status(200).json(upcomingLiveClasses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** GET: http://localhost:8080/api/instructorcompletedlive
 * @header : Bearer <instrucotr>
 */
export async function completedClasses(req, res) {
	try {
		const { instructorID } = req.instructor;
        const courses = await CoursesModel.find({ instructor: instructorID });

        let completedLiveClasses = [];

        courses.forEach(course => {
            course.curriculum.forEach(chapter => {
                chapter.lessons.forEach(lesson => {
                    if (lesson.isLiveClass && new Date(lesson.liveClass.startDate) < new Date()) {
                        completedLiveClasses .push({
							title: course.title,
                            courseID: course._id,
                            chapter_name: chapter.chapter_name,
                            ...lesson.toObject(),
                        });
                    }
                });
            });
        });

        res.status(200).json(completedLiveClasses);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

/** POST: http://localhost:8080/api/createlivestream
@body :{
	"courseId": "66a9ffd361cf3aa508d3e322",
	"lessonId": "66a9ffd361cf3aa508d3e324",
	"startDate": "2024-08-10T12:00:00.000+00:00"
}
**/
export async function createLiveStream(req, res){
	try {
		const { instructorID } = req.instructor;
		const { courseId , lessonId, startDate } = req.body;
		
		const course = await CoursesModel.findById(courseId).populate('instructor');
		
		if(!course){
			return res.status(404).json({ message: 'Course not found' });
		}

		const instructor  = await InstructorModel.findById(instructorID)

		let foundLesson = null;
        course.curriculum.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                if (lesson._id.toString() === lessonId) {
                    foundLesson = lesson;
                }
            });
        });
		
		if (!foundLesson) {
            return res.status(404).json({ message: 'Lesson not found in the course curriculum' });
        }

		const streamKey = uuidv4();
		foundLesson.liveClass.streamKey = streamKey;
		foundLesson.liveClass.startDate = startDate;
		
		await course.save();

		if (!instructor.StreamIds) {
            instructor.StreamIds = [];
        }
        instructor.StreamIds.push(streamKey);
        await instructor.save();

        // Return success response
        res.status(200).json({ success: true, message: 'Stream key generated and saved successfully', streamKey });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}


/** POST: http://localhost:8080/api/addCourseByInstructor
* @body : {
    dummy.json
}
*/
export async function addCourseByInstructor(req, res) {
	try {
		let courseData = req.body;
		courseData.slug = slugify(courseData.title);
		courseData.display = false; // Adding display field set to false
		let course = new CoursesModel(courseData);
		await course.save();
		res.status(201).json({
			success: true,
			msg: 'Course added successfully',
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Internal server error' + error.message });
	}
}