import {Router} from 'express'
const router = Router()

import * as TestModuleControllers from '../controllers/TestModuleController.js'
import * as QnaControllers from '../controllers/QnaController.js'
import AdminAuth from '../middleware/adminauth.js'
import Abort from '../middleware/abort.js'
import Auth , { localVariables } from '../middleware/auth.js'
// POST ROUTES
router.route('/createtestmodule').post(AdminAuth,TestModuleControllers.createTestModule);
router.route('/addquestiontomodule').post(AdminAuth,QnaControllers.addQuestionToModule);
// GET ROUTES
router.route('/gettestquestions').get(Abort, QnaControllers.getTestQuestions);
router.route('/getmodulequestions').get(Auth, localVariables, QnaControllers.getModuleQuestions);
router.route('/getallmodules').get(TestModuleControllers.getAllModules);

// PUT ROUTES

// DELETE ROUTES

export default router