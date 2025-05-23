import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import UserModel from '../model/User.model.js';
import InstructorModel from '../model/Instructor.model.js'
import SavedResumeModel from '../model/SavedResume.model.js';
import TrainingCertificateModel from '../model/TrainingCertificate.model.js';
// upading AWS config
aws.config.update({
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const BUCKET = process.env.AWS_BUCKET
const s3 = new aws.S3();

// middleware
export const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = 'assets/'+ newFileName;
            cb(null, fullPath)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

export const uploadUserProfile = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = 'images/profile/'+ newFileName;
            cb(null, fullPath)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

export const uploadInstructorProfile = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = 'images/profile/instructors/'+ newFileName;
            cb(null, fullPath)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

export const uploadCompanyLogo = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = 'images/profile/companylogo/'+ newFileName;
            cb(null, fullPath)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

/** POST: http://localhost:8080/api/uploadassignmenttoaws/:assignmentID
    body: {
        file: < file >
    }
 */
export const uploadassignment = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = req.params.assignmentID;
            var fullPath = 'assignments/'+ newFileName;
            cb(null, fullPath)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

/** POST: http://localhost:8080/api/uploadfiletoaws
    body:{
        file:[ file.mp4]
    }
**/
export async function uploadFile(req, res) {
    try {
        const files = req.files; // Multer will attach an array of files to req.files
        if (!files || files.length === 0) {
            return res.status(400).send({ success: false, message: 'No files uploaded' });
        }

        // If you need to do something with the uploaded files, you can process them here
        const fileDetails = files.map(file => ({
            originalName: file.originalname,
            path: file.location,
            mimetype: file.mimetype,
            size: file.size,
        }));

        res.status(200).send({ success: true, files: fileDetails });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).send({ success: false, message: 'Error uploading files: ' + error.message });
    }
}

export async function uploadCompanyLogoFun(req, res) {
    return res.status(200).json({ success: true, message: 'Successfully Uploaded', url: req.file.location });
}

/** POST: http://localhost:8080/api/uploaduserprofiletoaws
    header: Bearer <Token>
    body:{
        file: file.jpeg
    }
**/
export async function uploaduserprofiletoaws(req, res) {
    const { userID } = req.user;
    if (req.file?.location) {
        UserModel.updateOne({ _id: userID }, {profile: req.file.location})
        .exec()
        .then(()=>{
            return res.status(200).json({ success: true, message: 'User profile updated successfully.', url: req.file.location });
        })
        .catch((error)=>{
            return res.status(200).json({ success: false, message: 'Internal Server Error!', error});
        })
    } else {
        return res.status(200).json({ success: false, message: 'Internal Server Error -  AWS'});
    }
}

/** POST: http://localhost:8080/api/uploadinsprofiletoaws
    header: Bearer <Token>
    body:{
        instructorID: "ce6e8276323c7638117983"
        file: file.jpeg
    }
**/
export async function uploadinsprofiletoaws(req, res) {
    const { instructorID } = req.body;
    if (req.file?.location) {
        InstructorModel.updateOne({ _id: instructorID }, {profile: req.file.location})
        .exec()
        .then(()=>{
            return res.status(200).json({ success: true, message: 'User profile updated successfully.', url: req.file.location });
        })
        .catch((error)=>{
            return res.status(200).json({ success: false, message: 'Internal Server Error', error});
        })
    } else {
        return res.status(200).json({ success: false, message: 'Internal Server Error -  AWS'});
    }
}

/** POST: http://localhost:8080/api/uploadinsprofiletoaws
    header: Bearer <Token>
    body:{
        instructorID: "ce6e8276323c7638117983"
        file: file.jpeg
    }
**/
export async function uploadassignmenttoaws(req, res) {
    return res.status(200).json({ success: true, message: 'Successfully Uploaded', url: req.file.location });
}

/** GET: http://localhost:8080/api/getfilesfromaws */
export async function getfilesfromaws(req, res) {
    let r = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    let data = []
    r.Contents.map(item => {
        if (!item.Key.includes("images/profile/") || !item.Key.includes("assignments/")) {
            data.push({
                title: item.Key.replace(/^assets\/\d+-/, ''),
                key: item.Key,
                url:  `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key.replace(/ /g, "%20")}`
            })
        }
    })
    return res.status(200).json({success: true, data})
}

/** GET: http://localhost:8080/api/getfilefromaws/:filename */
export async function getfilefromaws(req, res) {
    const filename = req.params.filename
    
    if (!filename) {
        return res.status(500).json({success: false, message: "File name is required"})
    }
    try {
        let data = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
        return res.send(data.Body)
    } catch (error) {
        return res.status(500).json({success: false, message: "File Not Found"})
    }
}

/** DELETE: http://localhost:8080/api/deletefilefromaws
    body {
        "filename": "images/profile/1711953235667-mrsahil.png"
    }
*/
export async function deleteFileFromAWS(req, res) {
    const {filename} = req.body
    
    if (!filename) {
        return res.status(500).json({success: false, message: "File name is required"})
    }

    try {
        await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
        return res.status(200).json({success: true, message: "File Deleted Successfully"})
    } catch (error) {
        return res.status(500).json({success: false, message: "File Not Found"})
    }
}

export const uploadCoursemedia = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            const { slug } = req.params;
            const newFileName = Date.now() + '-' + file.originalname;
            const fullPath = `course/${slug}/${newFileName}`;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
})

/** POST: http://localhost:8080/api/uploadcoursefiletoaws/:slug
    body:{
        file: file.mp4,
		slug: "Course Slug Name"
    }
**/
export async function uploadCourseMediatoAws(req, res) {
    try {
        // Check if the file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Successfully Uploaded', 
            url: req.file.location 
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error uploading file', 
            error: error.message || 'Unknown error' 
        });
    }
}

/** GET: http://localhost:8080/api/getcoursemedia/:slug */
export async function getCourseFilesFromAws(req, res) {
	const { slug } = req.params;
    try {
        // List objects in the specified bucket
        const result = await s3.listObjectsV2({ Bucket: BUCKET }).promise();

        // Filter and process objects to include only instructor media
        const mediaFiles = result.Contents.filter(item => item.Key.startsWith(`course/${slug}/`)).map(item => ({
            title: item.Key.replace(/^course\/\d+-/, ''),
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

// Custom sorting function to handle numeric prefixes in titles
const customSort = (a, b) => {
    const getNumberPrefix = (title) => {
        const match = title.match(/^(\d+(\.\d+)?)/); // Match numbers like 22.3 or 3.2
        return match ? parseFloat(match[0]) : null;
    };

    const numA = getNumberPrefix(a.title);
    const numB = getNumberPrefix(b.title);

    // If both have number prefixes, compare them numerically
    if (numA !== null && numB !== null) {
        return numA - numB;
    }

    // If only one has a number prefix, it comes first
    if (numA !== null) return -1;
    if (numB !== null) return 1;

    // Otherwise, compare alphabetically
    return a.title.localeCompare(b.title);
};


/** GET: http://localhost:8080/api/getAllfilesfromAws */
export async function getAllfilesfromAws(req, res) {
    let r = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    let folderData = {};

    // Helper function to categorize files based on their extension
    const categorizeFile = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
        const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

        if (imageExtensions.includes(extension)) return 'photos';
        if (videoExtensions.includes(extension)) return 'videos';
        if (documentExtensions.includes(extension)) return 'documents';
        return 'other'; // In case you want to handle other types
    };

    r.Contents.forEach(item => {
        // Split the key into folder parts
        const pathParts = item.Key.split('/');
        const fileName = pathParts.pop(); // Extract the file name from the key (last part)

        const fileData = {
            title: fileName.replace(/^\d+-/, ''),  // Strips the number prefix from file name
            key: item.Key,
            url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(item.Key)}`
        };

        // Traverse and create nested folder structure
        let currentFolder = folderData;

        pathParts.forEach((part, index) => {
            // If we are at the last folder level, categorize the file
            if (index === pathParts.length - 1) {
                const category = categorizeFile(fileName);

                if (!currentFolder[part]) {
                    currentFolder[part] = {
                        photos: [],
                        videos: [],
                        documents: [],
                        other: [] // For uncategorized or miscellaneous files
                    };
                }

                // Push file data into the appropriate category
                currentFolder[part][category].push(fileData);

                // Sort files within each category by title
                currentFolder[part][category].sort(customSort);

            } else {
                // If folder doesn't exist, create an empty object to hold files or subfolders
                if (!currentFolder[part]) {
                    currentFolder[part] = {};
                }
                // Move deeper into the folder structure
                currentFolder = currentFolder[part];
            }
        });
    });

    return res.status(200).json({ success: true, data: folderData });
}

/** PUT: http://localhost:8080/api/renameFileInAws 
body: {
    "oldKey": "course/React-Js/1728366839358-desktoppc21.jpg",
    "newKey": "course/React-Js/1728366839358-desktoppc214.jpg"
}
*/
export async function renameFileInAws(req, res) {
    try {
        const { oldKey, newKey } = req.body; // Expecting old and new file keys (file names) in the request body

        if (!oldKey || !newKey) {
            return res.status(400).json({ success: false, message: 'Both oldKey and newKey are required' });
        }

        // Step 1: Copy the object to the new key
        await s3.copyObject({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${oldKey}`, // Source: bucket/oldKey
            Key: newKey,  // Destination: newKey
            ACL: "public-read",
        }).promise();

        // Step 2: Delete the old object
        await s3.deleteObject({
            Bucket: BUCKET,
            Key: oldKey,  // Old key (file name) to delete
        }).promise();

        const newFileUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey.replace(/ /g, "%20")}`;

        return res.status(200).json({ success: true, message: 'File renamed successfully', newFileUrl });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error renaming file', error: error.message });
    }
}

export const uploadUserResume = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: BUCKET,
        key: function (req, file, cb) {
            const newFileName = Date.now() + '-' + req.body.name;
            const fullPath = `Resumes/${newFileName}`;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    fileFilter: (req, file, cb) => {
        // Only accept PDF files
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    },
});

// Helper function to delete a file from S3
const deleteFileFromS3 = async (fileUrl) => {
    try {
        const fileKey = fileUrl.split('.com/')[1];

        // Delete the file from S3
        await s3.deleteObject({
            Bucket: BUCKET,
            Key: fileKey,
        }).promise();
    } catch (error) {
        console.error('Error deleting file from S3:', error);
    }
};

/** POST: http://localhost:8080/api/saveUserResume
    body:{
        name: name,
		email: "email"
		resume: resume.pdf
    }
**/
export async function saveUserResume(req, res) {
    try {
        const { name, email } = req.body;

        // Check if file is uploaded successfully
        if (!req.file || !req.file.location) {
            return res.status(400).json({ success: false, message: 'Resume file is required.' });
        }

        // Check if a resume with the same email already exists
        const existingResume = await SavedResumeModel.findOne({ email });

        if (existingResume) {
            if (existingResume.resume) {
                await deleteFileFromS3(existingResume.resume);
            }

            // If resume already exists for this email, update the resume file URL
            existingResume.resume = req.file.location;
            await existingResume.save();

            return res.status(200).json({ success: true, message: 'Resume update successfully.', data: existingResume });
        } else {
            // If no existing resume, create a new document
            const newResume = new SavedResumeModel({
                name: name,
                email: email,
                resume: req.file.location, // The URL of the uploaded resume
            });

            // Save to the database
            await newResume.save();

            return res.status(200).json({ success: true, message: 'Resume saved successfully.', data: newResume });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
}

/** GET: http://localhost:8080/api/getAllUsersResumes */
export async function getAllUsersResumes(req, res) {
    try {
        const resumes = await SavedResumeModel.find();

        if (!resumes.length) {
            return res.status(404).json({ success: false, message: 'No resumes found.' });
        }

        return res.status(200).json({ success: true, message: 'Resumes found.', resumes });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
}

export const uploadTrainingCertificate = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: BUCKET,
        key: function (req, file, cb) {
            console.log('File Received:', file);

            const newFileName = Date.now() + '-' + file.originalname;
            const fullPath = `TrainingCertificate/${newFileName}`;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // Limit file size to 5MB
        fieldSize: 100 * 1024 * 1024, // Limit field size to 10MB
        fieldNameSize: 1024, // Maximum length of field names
    },
});

export async function saveTrainingCertificate(req, res) {
    try {
        const { certificateId } = req.body;

        console.log(req.file);
        
        // Check if file is uploaded successfully
        if (!req.file || !req.file.location) {
            return res.status(400).json({ success: false, message: 'Resume file is required.' });
        }

        // Check if a resume with the same email already exists
        const trainingCertificate = await TrainingCertificateModel.findOne({ certificateId });

        if (trainingCertificate) {
            if (trainingCertificate.certificatePdf) {
                await deleteFileFromS3(trainingCertificate.certificatePdf);
            }

            // If resume already exists for this email, update the resume file URL
            trainingCertificate.certificatePdf = req.file.location;
            await trainingCertificate.save();

            return res.status(200).json({ success: true, message: 'Resume update successfully.', data: trainingCertificate });
        } else {
            // If no existing resume, create a new document
            const newtrainingCertificate = new TrainingCertificateModel({
                certificateId: certificateId,
                certificatePdf: req.file.location, // The URL of the training Certificate
            });

            // Save to the database
            await newtrainingCertificate.save();

            return res.status(200).json({ success: true, message: 'Resume saved successfully.', data: newtrainingCertificate });
        }
    } catch (error) {
        console.log(error.message);
        
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
}

export async function getTrainingCertificate(req, res) {
    try {
        const { certificateId } = req.query;

        if(!certificateId){
            return res.status(400).json({ success: false, message: 'Certificate ID is required' });
        }
        // Check if a resume with the same email already exists
        const trainingCertificate = await TrainingCertificateModel.findOne({ certificateId });

        if (!trainingCertificate) {
            return res.status(404).json({ success: false, message: 'Training Certificate not found.' });
        }
        return res.status(200).json({ success: true, trainingCertificate });
    } catch (error) {
        console.log(error.message);
        
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
}