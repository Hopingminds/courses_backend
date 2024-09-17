import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import UserModel from '../model/User.model.js';
import InstructorModel from '../model/Instructor.model.js'
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
    return res.status(200).json({ 
        success: true, 
        message: 'Successfully Uploaded', 
        url: req.file.location 
    });
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

    r.Contents.map(item => {
        // Split the key into folder parts
        const pathParts = item.Key.split('/');
        const fileName = pathParts.pop(); // Extract the file name from the key (last part)

        const fileData = {
            title: fileName.replace(/^\d+-/, ''),  // Strips the number prefix from file name
            key: item.Key,
            url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key.replace(/ /g, "%20")}`
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