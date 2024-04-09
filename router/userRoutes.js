import {Router} from 'express'
const router = Router()

import * as controller from '../controllers/appController.js'
import * as CoursesController from '../controllers/CoursesController.js'
import Auth from '../middleware/auth.js'

// POST ROUTES
router.route('/register').post(controller.register)
router.route('/authenticate').post(Auth,(req,res)=>res.end())
router.route('/login').post(controller.verifyUser,controller.login)

// GET ROUTES
router.route('/user/:email').get(controller.getUser)
router.route('/user/:email/:coursename').get(CoursesController.getUserCourseBySlug)
router.route('/getusercompletedassignemnts/:email').get(CoursesController.getUserCompletedAssignments)

// PUT ROUTES
router.route('/updateuser').put(Auth, controller.updateUser)
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword)
router.route('/lessoncompleted').put( Auth,CoursesController.lessonCompleted)
router.route('/assignmentcompleted').put( Auth,CoursesController.assignmentCompleted)

// DELETE ROUTES

export default router