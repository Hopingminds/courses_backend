import { Router } from 'express';
const router = Router();

import * as AssessmentController from '../controllers/AssessmentController.js';
import AdminAuth from '../middleware/adminauth.js';
import { upload } from '../controllers/AssessmentController.js';
import Auth from '../middleware/auth.js';

// POST ROUTES
router.route('/createcourseassessment').post(AdminAuth, upload.single('questions'), AssessmentController.createAssessment);
router.route('/submitassessment').post(Auth, AssessmentController.submitAssessment);

// GET ROUTES
router.route('/courseassessments/:coursename').get(Auth, AssessmentController.getCourseAllAssessment);
router.route('/getassessment/:assessmentId').get(Auth, AssessmentController.getAssesment);

export default router;