import {Router} from 'express'
const router = Router()

import * as adminController from '../controllers/AdminController.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/registeradmin').post(AdminAuth, adminController.register)
router.route('/authenticateadmin').post(AdminAuth,(req,res)=>res.end())
router.route('/loginAdminWithEmail').post(adminController.verifyAdmin,adminController.loginWithEmail)
router.route('/loginAdminWithMobile').post(adminController.verifyAdmin,adminController.loginWithMobile)
router.route('/addaccessroutes').post( adminController.addAccessRoute)

// GET ROUTES
router.route('/admin').get(adminController.verifyAdmin, adminController.getAdmin)
router.route('/admins').get(AdminAuth, adminController.getallAdmins)
router.route('/getadmindashdata').get(adminController.getDashboardData)

// PUT ROUTES
router.route('/updateadmin').put(AdminAuth, adminController.updateAdmin)
router.route('/resetadminPassword').put(adminController.verifyAdmin, adminController.resetPassword)

// DELETE ROUTES

export default router