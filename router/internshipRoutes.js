import {Router} from 'express'
const router = Router()

import * as InternshipController from '../controllers/InternshipController.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/addInternship').post(AdminAuth, InternshipController.addInternship);

// GET ROUTES
router.route('/getAllInternships').get(AdminAuth, InternshipController.getAllInternships);
router.route('/getInternships').get(InternshipController.getInternships);
router.route('/getInternshipBySlug/:internshipName').get(InternshipController.getInternshipBySlug);

// PUT ROUTES
router.route('/updateInternship').put(InternshipController.updateInternship);

// DELETE ROUTES
router.route('/deleteInternship').delete(AdminAuth, InternshipController.deleteInternship);

export default router