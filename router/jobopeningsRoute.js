import {Router} from 'express'
const router = Router()

import * as jobopeningController from '../controllers/JobopeningsContoller.js'
import RecAuth from '../middleware/recauth.js'
import Auth from '../middleware/auth.js'
// POST ROUTES
router.route('/createjobopening').post(RecAuth, jobopeningController.createJobopening);

// GET ROUTES
router.route('/getalljobppenings').get(Auth, jobopeningController.getAllJobOpenings)

// PUT ROUTES

// DELETE ROUTES

export default router