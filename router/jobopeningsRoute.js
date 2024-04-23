import {Router} from 'express'
const router = Router()

import * as jobopeningController from '../controllers/JobopeningsContoller.js'
import AdminAuth from '../middleware/adminauth.js'
// POST ROUTES
router.route('/createjobopening').post(AdminAuth, jobopeningController.createJobopening);

// GET ROUTES
router.route('/getalljobppenings').get(jobopeningController.getAllJobOpenings)

// PUT ROUTES

// DELETE ROUTES

export default router