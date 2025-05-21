import {Router} from 'express'
const router = Router()

import * as InternshipController from '../controllers/InternshipController.js'
import * as HelpersController from '../controllers/HelpersController.js'
import * as AWSService from '../services/aws.service.js';
import AdminAuth from '../middleware/adminauth.js'
import Auth from '../middleware/auth.js';
import instAuth from '../middleware/instAuth.js'

// POST ROUTES
router.route('/addInternship').post(AdminAuth, InternshipController.addInternship);
router.route('/allotInternshipToStudents').post(instAuth, InternshipController.allotInternshipToStudents);
router.route('/addLessonAttendance').post(instAuth, InternshipController.addLessonAttendance);
router.route('/uploadStudentAssignment').post(AWSService.uploadStudentsInternshipAssignment.single('assignment'), InternshipController.uploadStudentAssignment);
router.route('/addClassToInternship').post(instAuth, InternshipController.addClassToInternship);
router.route('/uploadInternshipAssignment').post(instAuth, AWSService.uploadInternshipAssignment.single('assignment'), HelpersController.uploadedFileResponse);
router.route('/uploadInternshipNotes').post(instAuth, AWSService.uploadInternshipNotes.single('notes'), HelpersController.uploadedFileResponse);
router.route('/finishClassInInternship').post(instAuth, InternshipController.finishClassInInternship);
router.route('/releaseliveClassrecordingforInternship').post(instAuth, InternshipController.releaseliveClassrecordingforInternship);

// GET ROUTES
router.route('/getAllInternships').get(AdminAuth, InternshipController.getAllInternships);
router.route('/getInternships').get(InternshipController.getInternships);
router.route('/getInternshipBySlug/:internshipName').get(InternshipController.getInternshipBySlug);
router.route('/isInternshipInCart/:internshipId').get(Auth, InternshipController.isInternshipInCart);
router.route('/isInternshipInWishlist/:internshipId').get(Auth, InternshipController.isInternshipInWishlist);
router.route('/getUserInternshipBySlug/:internshipName').get(Auth, InternshipController.getUserInternshipBySlug);
router.route('/getInstructorsInternship').get(instAuth, InternshipController.getInstructorsInternship);
router.route('/getAllottedStudentsForInternship').get(instAuth, InternshipController.getAllottedStudentsForInternship);
router.route('/getStudentDetailsForInternship').get(instAuth, InternshipController.getStudentDetailsForInternship);
router.route('/getAllottedStudentsForSingleBatchInternship').get(instAuth, InternshipController.getAllottedStudentsForSingleBatchInternship);

// PUT ROUTES
router.route('/updateInternship').put(InternshipController.updateInternship);
router.route('/internshipLessonCompleted').put(Auth, InternshipController.internshipLessonCompleted);
router.route('/updateStudentAttendenceForLesson').put(Auth, InternshipController.updateStudentAttendenceForLesson);
router.route('/editClassInInternship').put(instAuth, InternshipController.editClassInInternship);

// DELETE ROUTES
router.route('/deleteInternship').delete(AdminAuth, InternshipController.deleteInternship);

export default router