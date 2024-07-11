import { Router } from 'express';
const router = Router();

import * as BatchesController from "../controllers/BatchesController.js"
import instAuth from '../middleware/instAuth.js'

// POST ROUTES
router.route('/createbatch').post(instAuth, BatchesController.createBatch);
router.route('/addusertobatch').post( BatchesController.addUserToBatch);

// GET ROUTES
router.route('/getcoursebatches/:courseId').get(instAuth, BatchesController.getBatchesByCourse);
router.route('/getbatchesusers/:batchId').get(instAuth, BatchesController.getBatchesUsers);

// DELETE ROUTES
router.route('/deletebatch').delete(instAuth, BatchesController.deleteBatch);
router.route('/removeusertobatch').delete( BatchesController.removeUserFromBatch);

// PUT ROUTES
router.route('/updateuserbatch').put(instAuth, BatchesController.updateUserBatch);

export default router;