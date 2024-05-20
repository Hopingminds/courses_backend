import {Router} from 'express'
const router = Router()

import * as jobopeningController from '../controllers/JobopeningsContoller.js'
import RecAuth from '../middleware/recauth.js'
import Auth from '../middleware/auth.js'
// POST ROUTES
router.route('/createjobopening').post(RecAuth, jobopeningController.createJobopening);

// GET ROUTES
router.route('/getalljobppenings').get(Auth, jobopeningController.getAllJobOpenings)
router.route('/getalljobppenings/rec').get(RecAuth, jobopeningController.getAllJobOpeningsRec)
router.route('/get-one-job-opening-details/:jobid').get(jobopeningController.getOneJobOpeningDeatils)

// PUT ROUTES
router.route('/update-job-opening-status').put(RecAuth, jobopeningController.updateJobOpeningStatus)

// DELETE ROUTES

export default router