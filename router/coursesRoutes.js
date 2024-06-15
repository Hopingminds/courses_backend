import {Router} from 'express'
const router = Router()

import * as CoursesController from '../controllers/CoursesController.js'
import * as CategoriesController from '../controllers/CategoriesController.js'
import Auth from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/addcourse').post(AdminAuth, CoursesController.addcourse)
router.route('/addcategory').post(CategoriesController.addcategory)
router.route('/addsubcategory').post(CategoriesController.addsubcategory)

// GET ROUTES
router.route('/courses').get(CoursesController.getCourses)
router.route('/recommendedcourses').get(CoursesController.getRecommendedCourses)
router.route('/course/:coursename').get(CoursesController.getCourseBySlug)
router.route('/categories').get(CategoriesController.getcategories)
router.route('/getminordegreecategories').get(CategoriesController.getMinordegreeCategories)
router.route('/categories/:categoryname').get(CategoriesController.getsubcategories)

// PUT ROUTES
router.route('/purchasecourse').put(Auth,CoursesController.purchasedCourse)
router.route('/blockcourses').put(AdminAuth,CoursesController.blockCourses)
router.route('/updatecourse').put(AdminAuth, CoursesController.updateCourse)

// DELETE ROUTES
router.route('/deletecourse').delete(AdminAuth, CoursesController.deleteCourse)

export default router