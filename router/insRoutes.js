import {Router} from 'express'
const router = Router()

import * as instructorController from '../controllers/InstructorController.js'
import AdminAuth from '../middleware/adminauth.js'
import instAuth from '../middleware/instAuth.js'

// POST ROUTES
router.route('/instregister').post(AdminAuth, instructorController.register)
router.route('/instlogin').post(instructorController.verifyInstructor,instructorController.login)

// GET ROUTES
router.route('/inst/:email').get(instructorController.getInstructor)
router.route('/instructors').get(AdminAuth, instructorController.getAllInstructors)

// PUT ROUTES
router.route('/updateinst').put(instAuth, instructorController.updateInstructor);
router.route('/resetinsPassword').put(instAuth, instructorController.updateInstructor);

// DELETE ROUTES

export default router