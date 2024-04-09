import {Router} from 'express'
const router = Router()

import * as careerController from '../controllers/CareerController.js'

// POST ROUTES
router.route('/addcareerfrom').post(careerController.addCareerForm);

// GET ROUTES

// PUT ROUTES

// DELETE ROUTES

export default router