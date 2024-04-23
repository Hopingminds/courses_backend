import {Router} from 'express'
const router = Router()

import * as pagesController from '../controllers/pagesController.js'

// POST ROUTES
router.route('/addcareerform').post(pagesController.addCareerForm);
router.route('/addhirefromusform').post(pagesController.hideFromUsForm);
router.route('/loginrecwithemail').post(pagesController.loginRecWithEmail);

// GET ROUTES

// PUT ROUTES

// DELETE ROUTES

export default router