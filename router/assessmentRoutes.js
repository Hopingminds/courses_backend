import { Router } from 'express';
const router = Router();

import * as AssessmentController from '../controllers/AssessmentController.js';
import * as ModuleAssessmentController from '../controllers/ModuleAssessmentController.js'
import AdminAuth from '../middleware/adminauth.js';
import { upload } from '../controllers/AssessmentController.js';
import Auth from '../middleware/auth.js';

// POST ROUTES
router.route('/createcourseassessment').post(AdminAuth, upload.single('questions'), AssessmentController.createAssessment);
router.route('/submitassessment').post(Auth, AssessmentController.submitAssessment);
router.route('/resetassessment').post(Auth, AssessmentController.requestForReassessment);
router.route('/createmoduleassessment').post(AdminAuth, ModuleAssessmentController.createModuleAssessment);
router.route('/addquestionstoassessmentmodule').post(AdminAuth, ModuleAssessmentController.addQuestionsToModuleAssessment);
router.route('/startmoduleassessment').post(Auth, ModuleAssessmentController.StartAssessment);

// GET ROUTES
router.route('/courseassessments/:coursename').get(Auth, AssessmentController.getCourseAllAssessment);
router.route('/getassessment').get(Auth, AssessmentController.getAssesment);
router.route('/getallmoduleassessment').get(AdminAuth, ModuleAssessmentController.getAllModuleAssessmentForAdmin);
router.route('/getallusersresultbymoduleassessment/:moduleAssessmentid').get(AdminAuth, ModuleAssessmentController.getAllUsersResultByModuleAssessment);
router.route('/getuserresultbymoduleassessment').get(AdminAuth, ModuleAssessmentController.getUsersResultByModuleAssessment);
router.route('/getmoduleassessment/:moduleAssessmentid').get(AdminAuth, ModuleAssessmentController.getModuleAssessment);
router.route('/getassesmentquestion').get(Auth, ModuleAssessmentController.getAssesmentQuestion);
router.route('/getallusermoduleassessment').get(Auth, ModuleAssessmentController.getAllModuleAssessment);
router.route('/getusermoduleassessment/:moduleAssessmentid').get(Auth, ModuleAssessmentController.getUserModuleAssessment);

//PUT ROUTES
router.route('/submitassessmentanswer').put(Auth, AssessmentController.submitAnswerForAssessment);
router.route('/submitassessment').put(Auth, AssessmentController.finishAssessment);
router.route('/updateassessment').put(AdminAuth, AssessmentController.updateAssessment);
router.route('/updatemoduleassessment/:moduleAssessmentid').put(AdminAuth, ModuleAssessmentController.editModuleAssessment);
router.route('/submitanswerformoduleassessment').put(Auth, ModuleAssessmentController.submitAnswerForModuleAssessment);
router.route('/submitmoduleassessment').put(Auth, ModuleAssessmentController.finishModuleAssessment);
router.route('/changeassessmentvisiblity/:moduleAssessmentid').put(AdminAuth, ModuleAssessmentController.ChangeAssessmentVisiblity);

//DELETE ROUTES
router.route('/deleteassessment').delete(AdminAuth, AssessmentController.deleteAssessment)
router.route('/deletemodulefromassessment').delete(AdminAuth, ModuleAssessmentController.deleteModuleFromAssessment)
router.route('/deleteModuleAssessment').delete(AdminAuth, ModuleAssessmentController.deleteModuleAssessment)

export default router;
