import {Router} from 'express'
const router = Router()

import * as collegeUserController from '../controllers/CollegeUserController.js'
import CollegeUserAuth from '../middleware/collegeUserauth.js'

// POST ROUTES
router.route('/registercollegeUser').post(collegeUserController.register)
router.route('/authenticatecollegeUser').post(CollegeUserAuth,(req,res)=>res.end())
router.route('/loginCollegeUserWithEmail').post(collegeUserController.verifyCollegeUser,collegeUserController.loginWithEmail)
router.route('/loginCollegeUserWithMobile').post(collegeUserController.verifyCollegeUser,collegeUserController.loginWithMobile)

// GET ROUTES
router.route('/collegeUser').get(collegeUserController.verifyCollegeUser, collegeUserController.getCollegeUser)
router.route('/collegeUsers').get(CollegeUserAuth, collegeUserController.getallCollegeUsers)

// PUT ROUTES
router.route('/updatecollegeUser').put(CollegeUserAuth, collegeUserController.updateCollegeUser)
router.route('/resetcollegeUserPassword').put(collegeUserController.verifyCollegeUser, collegeUserController.resetPassword)

// DELETE ROUTES

export default router