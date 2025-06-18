import {Router} from 'express'
const router = Router()

import * as controller from '../controllers/appController.js'
import * as helperController from '../controllers/HelpersController.js'
import * as awsController from '../controllers/AwsController.js'
import * as NotificationController from '../controllers/NotificationController.js'
import { registerMail } from '../controllers/mailer.js'
import {upload, uploadUserProfile, uploadInstructorProfile, uploadassignment, uploadCompanyLogo} from '../controllers/AwsController.js'
import { getBotResponse } from '../controllers/ChatBotController.js'
import Auth, { localVariables } from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'
import RecAuth from '../middleware/recauth.js'
import instAuth from '../middleware/instAuth.js'
import CollegeUserAuth from '../middleware/collegeUserauth.js'
// POST ROUTES
router.route('/registerMail').post(registerMail) 

router.route('/uploadfiletoaws').post(AdminAuth, upload.array('file',10), awsController.uploadFile)
router.route('/uploadCompanyLogo').post(RecAuth, uploadCompanyLogo.single('file'), awsController.uploadCompanyLogoFun)
router.route('/uploaduserprofiletoaws').post(Auth,(req, res, next) => {
  uploadUserProfile.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err); // 🔍 This will show the real error
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    res.send('File uploaded!'), awsController.uploaduserprofiletoaws)
router.route('/uploadinsprofiletoaws').post(AdminAuth,uploadInstructorProfile.single('file'), awsController.uploadinsprofiletoaws)
router.route('/uploadassignmenttoaws/:assignmentID').post(Auth, uploadassignment.single('file'), awsController.uploadassignmenttoaws)
router.route('/uploadcoursefiletoaws/:slug').post(AdminAuth, awsController.uploadCoursemedia.single('file'), awsController.uploadCourseMediatoAws)
router.route('/sendNotification').post(NotificationController.createNotification)
router.route('/maketeacherchatavailable').post(helperController.makeTeacherChatAvailable)
router.route('/sendEnquiry').post(helperController.sendEnquiry)
router.route('/saveUserResume').post(awsController.uploadUserResume.single('resume'), awsController.saveUserResume);
router.route('/saveTrainingCertificate').post(awsController.uploadTrainingCertificate.single('certificate'), awsController.saveTrainingCertificate);
router.route('/getDataFromExcelFile').post(helperController.getDataFromExcelFile);

router.route('/createEducationField').post(CollegeUserAuth, helperController.createEducationField);

// GET ROUTES
router.route('/generateOTP').get(controller.verifyUser, localVariables, controller.generateOTP)
router.route('/verifyOTP').get(controller.verifyOTP)
router.route('/createResetSession').get(controller.createResetSession)

router.route('/getAllfilesfromAws').get(awsController.getAllfilesfromAws)
router.route('/getfilesfromaws').get(awsController.getfilesfromaws)
router.route('/getfilefromaws/:filename').get(awsController.getfilefromaws)
router.route('/getcoursemedia/:slug').get(AdminAuth, awsController.getCourseFilesFromAws)
router.route('/getAllUsersResumes').get(AdminAuth, awsController.getAllUsersResumes)

router.route('/getcolleges').get(helperController.getColleges)
router.route('/isteacherchatavailable').get(Auth, helperController.isTeacherChatAvailable)
router.route('/isteacherchatavailableforinst').get(instAuth, helperController.isTeacherChatAvailable)
router.route('/getAllEnquiry').get(AdminAuth, helperController.getAllEnquiry)
router.route('/getAllEducationFields').get(CollegeUserAuth, helperController.getAllEducationFields);
router.route('/getTrainingCertificate').get(awsController.getTrainingCertificate);

// PUT ROUTES
router.route('/get-bot-response').post(getBotResponse)
router.route('/renameFileFromAws').put(AdminAuth, awsController.renameFileInAws)

router.route('/getVideoSubtitles').post(helperController.getVideoSubtitles)

// DELETE ROUTES 
router.route('/deletefilefromaws').delete(awsController.deleteFileFromAWS)
router.route('/deleteEducationField').delete(CollegeUserAuth, helperController.deleteEducationField);

export default router