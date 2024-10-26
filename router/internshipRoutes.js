import {Router} from 'express'
const router = Router()

import * as InternshipController from '../controllers/InternshipController.js'
import AdminAuth from '../middleware/adminauth.js'
import Auth from '../middleware/auth.js';

// POST ROUTES
router.route('/addInternship').post(AdminAuth, InternshipController.addInternship);
router.route('/internshipLessonCompleted').post(Auth, InternshipController.internshipLessonCompleted);

// GET ROUTES
router.route('/getAllInternships').get(AdminAuth, InternshipController.getAllInternships);
router.route('/getInternships').get(InternshipController.getInternships);
router.route('/getInternshipBySlug/:internshipName').get(InternshipController.getInternshipBySlug);
router.route('/isInternshipInCart/:internshipId').get(Auth, InternshipController.isInternshipInCart);
router.route('/isInternshipInWishlist/:internshipId').get(Auth, InternshipController.isInternshipInWishlist);
router.route('/getUserInternshipBySlug/:internshipName').get(Auth, InternshipController.getUserInternshipBySlug);

// PUT ROUTES
router.route('/updateInternship').put(InternshipController.updateInternship);

// DELETE ROUTES
router.route('/deleteInternship').delete(AdminAuth, InternshipController.deleteInternship);

export default router