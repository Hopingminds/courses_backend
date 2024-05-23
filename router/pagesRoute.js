import {Router} from 'express'
const router = Router()

import * as pagesController from '../controllers/pagesController.js'
import RecAuth from '../middleware/recauth.js'
// POST ROUTES
router.route('/addcareerform').post(pagesController.addCareerForm);
router.route('/addhirefromusform').post(pagesController.hideFromUsForm);
router.route('/loginrecwithemail').post(pagesController.loginRecWithEmail);

// GET ROUTES

// PUT ROUTES
router.route('/updateRec').put(RecAuth, pagesController.updateRecruiter);

// DELETE ROUTES

export default router