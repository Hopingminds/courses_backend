import {Router} from 'express'
const router = Router()

import * as FreelanceController from '../controllers/FreelancerController.js'
import Auth from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/createFreelancerOpening').post(AdminAuth, FreelanceController.createFreelancerOpening);

// GET ROUTES
router.route('/getAllFreelanceOpenings').get( FreelanceController.getAllFreelanceOpenings);
router.route('/getFreelanceOpening').get(FreelanceController.getFreelanceOpening);
router.route('/getFreelanceByCategory').get(FreelanceController.getFreelanceByCategory);

// PUT ROUTES
router.route('/updateFreelancerOpening').put(AdminAuth, FreelanceController.updateFreelancerOpening);
router.route('/changeFreelanceOpeningStatus').put(AdminAuth, FreelanceController.changeFreelanceOpeningStatus);

// DELETE ROUTES
router.route('/deleteFreelanceJob').delete(AdminAuth, FreelanceController.deleteFreelanceJob);

export default router