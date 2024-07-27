import {Router} from 'express'
const router = Router()

import * as adminController from '../controllers/AdminController.js'
import * as AccessRouteController from '../controllers/AccessRotesController.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/registeradmin').post(AdminAuth, adminController.register)
router.route('/authenticateadmin').post(AdminAuth,(req,res)=>res.end())
router.route('/loginAdminWithEmail').post(adminController.verifyAdmin,adminController.loginWithEmail)
router.route('/loginAdminWithMobile').post(adminController.verifyAdmin,adminController.loginWithMobile)
router.route('/addaccessroutes').post(AccessRouteController.createAccessRoute)

// GET ROUTES
router.route('/admin').get(adminController.verifyAdmin, adminController.getAdmin)
router.route('/admins').get(AdminAuth, adminController.getallAdmins)
router.route('/getadmindashdata').get(adminController.getDashboardData)
router.route('/getaccessroute/:role').get(AccessRouteController.getAccessRoute)
router.route('/verifyadminuser/:route').get(AdminAuth, AccessRouteController.verifyAdminUserAccess)

// PUT ROUTES
router.route('/updateadmin').put(AdminAuth, adminController.updateAdmin)
router.route('/resetadminPassword').put(adminController.verifyAdmin, adminController.resetPassword)
router.route('/updateaccess').put(AccessRouteController.updateAccessRoute)

// DELETE ROUTES
router.route('/deletehmuser').delete(AdminAuth, adminController.deleteHMUser)

export default router