import {Router} from 'express'
const router = Router()

import * as TestModuleControllers from '../controllers/TestModuleController.js'
import * as QnaControllers from '../controllers/QnaController.js'
import AdminAuth from '../middleware/adminauth.js'
// POST ROUTES
router.route('/createtestmodule').post(AdminAuth,TestModuleControllers.createTestModule);
router.route('/addquestiontomodule').post(AdminAuth,QnaControllers.addQuestionToModule);
// GET ROUTES
router.route('/gettestquestions').get(QnaControllers.getTestQuestions);
router.route('/getmodulequestions').get(QnaControllers.getModuleQuestions);
router.route('/getallmodules').get(TestModuleControllers.getAllModules);

// PUT ROUTES

// DELETE ROUTES

export default router