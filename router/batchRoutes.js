import { Router } from 'express';
const router = Router();

import * as BatchesController from "../controllers/BatchesController.js"
import instAuth from '../middleware/instAuth.js'
import Auth from '../middleware/auth.js';
import AdminAuth from '../middleware/adminauth.js';

// POST ROUTES
router.route('/setBatchForStudent').post(Auth, BatchesController.setBatchForStudent);
router.route('/addUserToBatch').post( BatchesController.addUserToBatch);

// GET ROUTES
router.route('/getBatch/:batchId').get(AdminAuth, BatchesController.getBatch);
router.route('/getUpcomingBatchesForCourse/:courseId').get(BatchesController.getUpcomingBatchesForCourse);
router.route('/getAllBatchesForCourse/:courseId').get(BatchesController.getAllBatchesForCourse);
router.route('/getAllCourseUsers/:courseId').get(BatchesController.getAllCourseUsers);
// DELETE ROUTES

// PUT ROUTES
router.route('/editBatchDetails').put(AdminAuth, BatchesController.editBatchDetails);
router.route('/editBatchCurriculum/:batchId').put(AdminAuth, BatchesController.editBatchCurriculum);
router.route('/removeUserFromBatch').put( BatchesController.removeUserFromBatch);

export default router;