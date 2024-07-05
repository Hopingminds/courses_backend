import { Router } from 'express';
const router = Router();

import * as BatchesController from "../controllers/BatchesController.js"
import instAuth from '../middleware/instAuth.js'

// POST ROUTES
router.route('/createbatch').post(instAuth, BatchesController.createBatch);

// GET ROUTES
router.route('/getcoursebatches').get(instAuth, BatchesController.getBatchesByCourse);

export default router;