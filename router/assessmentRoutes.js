import { Router } from 'express';
const router = Router();

import * as AssessmentController from '../controllers/AssessmentController.js';
import AdminAuth from '../middleware/adminauth.js';
import { upload } from '../controllers/AssessmentController.js'; // Adjust path if necessary

// POST ROUTES
router.route('/createcourseassessment').post(AdminAuth, upload.single('questions'), AssessmentController.createAssessment);

// GET ROUTES
router.route('/courseassessments/:coursename').get(AdminAuth, AssessmentController.getCourseAllAssessment);

export default router;
