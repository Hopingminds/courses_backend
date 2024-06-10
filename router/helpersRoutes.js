import {Router} from 'express'
const router = Router()

import * as controller from '../controllers/appController.js'
import * as helperController from '../controllers/HelpersController.js'
import * as awsController from '../controllers/AwsController.js'
import { registerMail } from '../controllers/mailer.js'
import {upload, uploadUserProfile, uploadInstructorProfile, uploadassignment, uploadCompanyLogo} from '../controllers/AwsController.js'
import { getBotResponse } from '../controllers/ChatBotController.js'
import Auth, { localVariables } from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'
import RecAuth from '../middleware/recauth.js'
// POST ROUTES
router.route('/registerMail').post(registerMail) 

router.route('/uploadfiletoaws').post(AdminAuth, upload.single('file'), awsController.uploadFile)
router.route('/uploadCompanyLogo').post(RecAuth, uploadCompanyLogo.single('file'), awsController.uploadCompanyLogoFun)
router.route('/uploaduserprofiletoaws').post(Auth,uploadUserProfile.single('file'), awsController.uploaduserprofiletoaws)
router.route('/uploadinsprofiletoaws').post(AdminAuth,uploadInstructorProfile.single('file'), awsController.uploadinsprofiletoaws)
router.route('/uploadassignmenttoaws/:assignmentID').post(Auth, uploadassignment.single('file'), awsController.uploadassignmenttoaws)

// GET ROUTES
router.route('/generateOTP').get(controller.verifyUser, localVariables, controller.generateOTP)
router.route('/verifyOTP').get(controller.verifyOTP)
router.route('/createResetSession').get(controller.createResetSession)

router.route('/getfilesfromaws').get(awsController.getfilesfromaws)
router.route('/getfilefromaws/:filename').get(awsController.getfilefromaws)

router.route('/getcolleges').get(helperController.getColleges)

// PUT ROUTES
router.route('/get-bot-response').post(getBotResponse)

// DELETE ROUTES 
router.route('/deletefilefromaws').delete(awsController.deleteFileFromAWS)

export default router