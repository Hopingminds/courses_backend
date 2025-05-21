import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';

dotenv.config(); // Load environment variables

aws.config.update({
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const BUCKET = process.env.AWS_BUCKET;
if (!BUCKET) {
    throw new Error("AWS_BUCKET environment variable is not defined");
}

const s3 = new aws.S3();

export const uploadInternshipAssignment = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = `Internships/${req.query.slug}/Assignments/` + newFileName;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
});

export const uploadInternshipNotes = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = `Internships/${req.query.slug}/Notes/` + newFileName;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
});

export const uploadStudentsInternshipAssignment = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            var newFileName = Date.now() + "-" + file.originalname;
            var fullPath = `Internships/${req.query.slug}/Students-Assignments/` + newFileName;
            cb(null, fullPath);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
});

export async function deleteFile(filename) {
    if (!filename) {
        throw new Error("File name is required");
    }
    try {
        let fileKey = filename.split('.com/')[1].replaceAll(' ', '%20');
        fileKey = decodeURIComponent(fileKey);

        await s3.deleteObject({ Bucket: BUCKET, Key: fileKey }).promise();
        return true;
    } catch (error) {
        return false
    }
}

// Function to upload any file to S3
export async function uploadCertificate(fileName, fileBuffer, contentType = "application/pdf") {
    try {
        const params = {
            Bucket: BUCKET,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
            ACL: "public-read",
        };

        // If file is larger than 5MB, use multipart upload
        if (fileBuffer.length > 5 * 1024 * 1024) {
            console.log("Using Multipart Upload for large PDF...");
            const upload = await s3.createMultipartUpload(params).promise();
            return upload.Location;
        }

        // Estimate header size
        const headers = {
            "x-amz-acl": "public-read",
            "Content-Type": "application/pdf",
            "Content-Length": fileBuffer.length,
        };

        console.log("Estimated Header Size:", JSON.stringify(headers).length, "bytes");
        // Upload file to S3
        const uploadedData = await s3.upload(params).promise();

        return uploadedData.Location; // Return the S3 file URL
    } catch (error) {
        throw new Error("S3 Upload Failed: " + error.message);
    }
}

export async function uploadInternshipRecordingToS3(filePath, streamKey, lesson_name, InternshipTitle) {
    // Upload to S3
    try {
        // Download file from Google Drive
        const response = await axios({
            url: filePath,
            method: 'GET',
            responseType: 'arraybuffer',  // Get binary data
        });

        // Determine file extension (default to .mp4 if unknown)
        let contentType = response.headers['content-type'] || 'video/mp4';
        let fileExt = "";
        if (contentType.includes("video/mp4")) fileExt = ".mp4";
        else if (contentType.includes("video/webm")) fileExt = ".webm";
        else if (contentType.includes("audio/mpeg")) fileExt = ".mp3";
        else fileExt = ".bin";  // Fallback

        // Define temp file path
        const tempFilePath = `./uploads/${lesson_name}_${Date.now()}${fileExt}`;
        fs.writeFileSync(tempFilePath, response.data);


        // Configure the upload parameters
        const fileName = `Internships/${InternshipTitle}/Recordings/${lesson_name}_${streamKey}_${Date.now()}${fileExt}`;
        const params = {
            Bucket: BUCKET,
            Key: fileName,
            Body: fs.readFileSync(tempFilePath),
            ContentType: contentType,
            ACL: 'public-read'  // Make the file publicly accessible
        };

        const data = await s3.upload(params).promise();
        console.log("File uploaded successfully:", data.Location);

        // Delete the local file after successful upload
        fs.unlinkSync(tempFilePath);

        return data.Location; // Return the URL of the uploaded file
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw err;
    }
}
