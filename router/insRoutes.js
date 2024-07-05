import {Router} from 'express'
const router = Router()

import * as instructorController from '../controllers/InstructorController.js'
import AdminAuth from '../middleware/adminauth.js'
import instAuth from '../middleware/instAuth.js'

// POST ROUTES
router.route('/instregister').post(AdminAuth, instructorController.register)
router.route('/instlogin').post(instructorController.verifyInstructor,instructorController.login)
router.route('/uploadinsmediatoaws').post(instAuth, instructorController.uploadInstructormedia.single('file'), instructorController.uploadInstMediatoAws);

// GET ROUTES
router.route('/inst/:email').get(instructorController.getInstructor)
router.route('/instructors').get(AdminAuth, instructorController.getAllInstructors)
router.route('/getinsmedia').get(instAuth, instructorController.getInstFilesFromAws);
router.route('/instructorcourses').get(instAuth, instructorController.getCoursesByInstructorId);
router.route('/instructorupcominglive').get(instAuth, instructorController.getUpcomingLiveClasses);
router.route('/instructorcompletedlive').get(instAuth, instructorController.completedClasses);

// PUT ROUTES
router.route('/updateinst').put(instAuth, instructorController.updateInstructor);
router.route('/updateinstructoradmin').put(AdminAuth, instructorController.updateInstructorAdmin);
router.route('/resetinsPassword').put(instAuth, instructorController.updateInstructor);

// DELETE ROUTES

export default router