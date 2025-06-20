import { Router } from "express";
const router = Router();

import * as controller from "../controllers/appController.js";
import * as CoursesController from "../controllers/CoursesController.js";
import * as OtpController from "../controllers/OtpController.js";
import * as RegisterUserController from "../controllers/RegisterUserController.js";
import Auth, { localVariables } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/access.limiter.js";
import AdminAuth from "../middleware/adminauth.js";

// POST ROUTES
router.route("/register").post(controller.register);
router.route("/register-swayam").post(controller.registerSwayam);

router.route("/add-course").post(controller.addCourse);

router.route("/authenticate").post(Auth, (req, res) => res.end());
router.route("/login").post(controller.verifyUser, controller.login);
router
  .route("/sendmobileotp")
  .post(apiLimiter, OtpController.generateOtpForMobile);
router.route("/verfiynumberotp").post(OtpController.verifyOtp);
router.route("/loginwithotp").post(OtpController.loginWithOtp);
router.route("/validatevalues").post(controller.validateFields);
router
  .route("/registeruserform")
  .post(localVariables, RegisterUserController.registerUserforHm);
router
  .route("/createcoursesbycategorie")
  .post(AdminAuth, RegisterUserController.createCoursesByCategorie);
router
  .route("/cancelAccountDeletion")
  .post(Auth, controller.cancelAccountDeletion);

// GET ROUTES
router.route("/user/:email").get(controller.getUser);
router
  .route("/user/:email/:coursename")
  .get(CoursesController.getUserCourseBySlug);
router
  .route("/getusercompletedassignemnts/:email")
  .get(CoursesController.getUserCompletedAssignments);
router
  .route("/getcoursesfordegree")
  .get(RegisterUserController.getCoursesforDegree);
router.route("/validateuserfields").get(RegisterUserController.validateUser);
router
  .route("/getcoursesbycategorie")
  .get(RegisterUserController.getCoursesByCategorie);
router.route("/completedcourse").get(Auth, CoursesController.CompletedCourses);
router
  .route("/generateemailloginOTP")
  .get(controller.verifyUser, localVariables, controller.getEmailLoginOTP);
router.route("/verifyemailOTP").get(controller.verifyEmailOTP);

// PUT ROUTES
router.route("/updateuser").put(Auth, controller.updateUser);
router
  .route("/resetPassword")
  .put(controller.verifyUser, controller.resetPassword);
router.route("/lessoncompleted").put(Auth, CoursesController.lessonCompleted);
router
  .route("/assignmentcompleted")
  .put(Auth, CoursesController.assignmentCompleted);
router
  .route("/editcoursecategory")
  .put(AdminAuth, RegisterUserController.editCoursesByCategorie);

// DELETE ROUTES
router.route("/deleteAccount").delete(Auth, controller.deleteAccount);

export default router;
