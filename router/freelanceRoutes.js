import {Router} from 'express'
const router = Router()

import * as FreelanceController from '../controllers/FreelancerController.js'
import Auth from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/createFreelancerOpening').post(AdminAuth, FreelanceController.createFreelancerOpening);

// GET ROUTES
router.route('/getAllFreelanceOpenings').get(AdminAuth, FreelanceController.getAllFreelanceOpenings);
router.route('/getFreelanceOpening').get(AdminAuth, FreelanceController.getFreelanceOpening);

// PUT ROUTES
router.route('/updateFreelancerOpening').put(AdminAuth, FreelanceController.updateFreelancerOpening);
router.route('/changeFreelanceOpeningStatus').put(AdminAuth, FreelanceController.changeFreelanceOpeningStatus);

// DELETE ROUTES

export default router