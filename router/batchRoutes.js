import { Router } from 'express';
const router = Router();

import * as BatchesController from "../controllers/BatchesController.js"
import instAuth from '../middleware/instAuth.js'
import Auth from '../middleware/auth.js';

// POST ROUTES
router.route('/setBatchForStudent').post(Auth, BatchesController.setBatchForStudent);

// GET ROUTES
router.route('/getUpcomingBatchesForCourse/:courseId').get(BatchesController.getUpcomingBatchesForCourse);
router.route('/getAllBatchesForCourse/:courseId').get(BatchesController.getAllBatchesForCourse);
// DELETE ROUTES

// PUT ROUTES

export default router;