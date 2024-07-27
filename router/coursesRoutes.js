import {Router} from 'express'
const router = Router()

import * as CoursesController from '../controllers/CoursesController.js'
import * as CategoriesController from '../controllers/CategoriesController.js'
import * as PromoCodeController from '../controllers/PromoCodeController.js'
import Auth from '../middleware/auth.js'
import AdminAuth from '../middleware/adminauth.js'

// POST ROUTES
router.route('/addcourse').post(AdminAuth, CoursesController.addcourse)
router.route('/addcategory').post(CategoriesController.addcategory)
router.route('/addsubcategory').post(CategoriesController.addsubcategory)
router.route('/addliveclass').post(CoursesController.addLiveClassToChapter)
router.route('/createpromocode').post(AdminAuth, PromoCodeController.createPromo)

// GET ROUTES
router.route('/courses').get(CoursesController.getCourses)
router.route('/coursesforadmin').get(CoursesController.getAllCourses)
router.route('/recommendedcourses').get(CoursesController.getRecommendedCourses)
router.route('/course/:coursename').get(CoursesController.getCourseBySlug)
router.route('/categories').get(CategoriesController.getcategories)
router.route('/getminordegreecategories').get(CategoriesController.getMinordegreeCategories)
router.route('/categories/:categoryname').get(CategoriesController.getsubcategories)
router.route('/search').get(CoursesController.courseSearch)
router.route('/completedliveclasses').get(CoursesController.getCompletedLiveClasses)
router.route('/getallorders').get(AdminAuth, CoursesController.getAllOrders)
router.route('/getuserorders').get(Auth, CoursesController.getOrderByUser)
router.route('/iscourseincart/:courseId').get(Auth, CoursesController.isCourseInCart)
router.route('/getallpromocode').get(Auth, PromoCodeController.getAllPromos)
router.route('/getallpromocodeadmin').get(AdminAuth, PromoCodeController.getAllPromos)
router.route('/ispromocodevalid/:promoCode').get(Auth, PromoCodeController.isPromoValid)
router.route('/iscourseinwishlist/:courseId').get(Auth, CoursesController.isCourseInWishlist)

// PUT ROUTES
router.route('/purchasecourse').put(Auth,CoursesController.purchasedCourse)
router.route('/blockcourses').put(AdminAuth,CoursesController.blockCourses)
router.route('/updatecourse').put(AdminAuth, CoursesController.updateCourse)
router.route('/updatepromocode').put(AdminAuth, PromoCodeController.updatePromo)

// DELETE ROUTES
router.route('/deletecourse').delete(AdminAuth, CoursesController.deleteCourse)
router.route('/deletepromocode').delete(AdminAuth, PromoCodeController.deletePromo)

export default router