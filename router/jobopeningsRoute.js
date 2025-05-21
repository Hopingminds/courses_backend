import {Router} from 'express'
const router = Router()

import * as jobopeningController from '../controllers/JobopeningsContoller.js'
import * as applyJob from '../controllers/JobApplyController.js'
import * as InHousePlacementsController from '../controllers/InHousePlacementsController.js'
import RecAuth from '../middleware/recauth.js'
import Auth from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'
import { uploadUserResume } from '../controllers/AwsController.js'

// POST ROUTES
router.route('/createjobopening').post(RecAuth, jobopeningController.createJobopening);
router.route('/apply-job').post(Auth, applyJob.applyJob);
router.route('/createAInHousePlacement').post(AdminAuth, InHousePlacementsController.createAInHousePlacement);
router.route('/addApplicantsForInHousePlacement').post(AdminAuth, InHousePlacementsController.addApplicantsForInHousePlacement);
router.route('/ApplyForInHousePlacement').post(uploadUserResume.single('resume'), InHousePlacementsController.ApplyForInHousePlacement);

// GET ROUTES
router.route('/getalljobppenings').get(Auth, jobopeningController.getAllJobOpenings)
router.route('/getalljobppenings/rec').get(RecAuth, jobopeningController.getAllJobOpeningsRec)
router.route('/get-one-job-opening-details/:jobid').get(jobopeningController.getOneJobOpeningDeatils)
router.route('/get-user-job-applications').get(Auth, applyJob.getUserApplications)
router.route('/getAllInHousePlacement').get(AdminAuth, InHousePlacementsController.getAllInHousePlacement);
router.route('/getInHousePlacement').get(InHousePlacementsController.getInHousePlacement);
router.route('/getInHousePlacementByCategory').get(InHousePlacementsController.getInHousePlacementByCategory);

// PUT ROUTES
router.route('/update-job-opening-status').put(RecAuth, jobopeningController.updateJobOpeningStatus)
router.route('/updateInHousePlacement').put(AdminAuth, InHousePlacementsController.updateInHousePlacement);
router.route('/changeInHousePlacementStatus').put(AdminAuth, InHousePlacementsController.changeInHousePlacementStatus);

// DELETE ROUTES
router.route('/deleteInHousePlacementJob').delete(AdminAuth, InHousePlacementsController.deleteInHousePlacementJob);

export default router