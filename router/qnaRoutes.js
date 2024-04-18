import {Router} from 'express'
const router = Router()

import * as TestModuleControllers from '../controllers/TestModuleController.js'
import * as QnaControllers from '../controllers/QnaController.js'

// POST ROUTES
router.route('/addquestiontomodule').post(QnaControllers.addQuestionToModule);

// GET ROUTES

// PUT ROUTES

// DELETE ROUTES

export default router