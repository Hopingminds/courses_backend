import {Router} from 'express'
const router = Router()

import * as pagesController from '../controllers/pagesController.js'
import AdminAuth from '../middleware/adminauth.js'
// POST ROUTES
router.route('/addcareerform').post(pagesController.addCareerForm);
router.route('/addhirefromusform').post(pagesController.hideFromUsForm);
router.route('/loginrecwithemail').post(pagesController.loginRecWithEmail);

// GET ROUTES
router.route('/getAllRec').get(AdminAuth, pagesController.getAllRecruiter);

// PUT ROUTES
router.route('/updateRec').put(AdminAuth, pagesController.updateRecruiter);

// DELETE ROUTES

export default router