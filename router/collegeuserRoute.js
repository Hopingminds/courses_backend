import {Router} from 'express'
const router = Router()

import * as collegeUserController from '../controllers/CollegeUserController.js'
import CollegeUserAuth from '../middleware/collegeUserauth.js'
import AdminAuth from '../middleware/adminauth.js'
import * as fileController from '../controllers/FileController.js'
// POST ROUTES
router.route('/registercollegeUser').post(AdminAuth, collegeUserController.register)
router.route('/authenticatecollegeUser').post(CollegeUserAuth,(req,res)=>res.end())
router.route('/loginCollegeUserWithEmail').post(collegeUserController.verifyCollegeUser,collegeUserController.loginWithEmail)
router.route('/loginCollegeUserWithMobile').post(collegeUserController.verifyCollegeUser,collegeUserController.loginWithMobile)
//-- File Handler
router.route('/upload-students').post(CollegeUserAuth, fileController.handleFileUpload, fileController.upload) // upload xlsx file

// GET ROUTES
router.route('/collegeUser').get(collegeUserController.verifyCollegeUser, collegeUserController.getCollegeUser)
router.route('/collegeUsers').get(AdminAuth, collegeUserController.getallCollegeUsers)
router.route('/get-college-students').get(CollegeUserAuth, collegeUserController.getAllCollegeStudents)
router.route('/getSingleCollegeStudent').get(CollegeUserAuth, collegeUserController.getSingleCollegeStudent)
router.route('/acceptCourse/:email').get(fileController.acceptCourse)

// PUT ROUTES
router.route('/updatecollegeUser').put(CollegeUserAuth, collegeUserController.updateCollegeUser)
router.route('/updatecollegeUserAdmin/:collegeUserID').put(AdminAuth, collegeUserController.updateCollegeUserAdmin)
router.route('/resetcollegeUserPassword').put(collegeUserController.verifyCollegeUser, collegeUserController.resetPassword)

// DELETE ROUTES

export default router