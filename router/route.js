import {Router} from 'express'
const router = Router()
import * as controller from '../controllers/appController.js'
import * as CoursesController from '../controllers/CoursesController.js'
import { registerMail } from '../controllers/mailer.js'
import Auth, { localVariables } from '../middleware/auth.js'
import * as CategoriesController from '../controllers/CategoriesController.js'
/** POST Methods */
router.route('/register').post(controller.register)
router.route('/registerMail').post(registerMail) // register mail
router.route('/authenticate').post(controller.verifyUser,(req,res)=>res.end()) // authenticate user
router.route('/login').post(controller.verifyUser,controller.login) // login in app
//-- POST Categories
router.route('/addcategory').post(CategoriesController.addcategory); // is use to add a category
router.route('/addsubcategory').post(CategoriesController.addsubcategory); // is use to add a subcategory
//-- POST Courses 
router.route('/addcourse').post(CoursesController.addcourse)
router.route('/addtocart').post(controller.verifyUser, CoursesController.addToCart); // is use to add to wishlist
router.route('/removefromcart').post(controller.verifyUser, CoursesController.removeFromCart); // is use to add to wishlist
router.route('/addtowishlist').post(controller.verifyUser, CoursesController.addtowishlist); // is use to add to wishlist
router.route('/removefromwishlist').post(controller.verifyUser, CoursesController.removeFromWishlist); // is use to remove from wishlist

/** GET Methods */
router.route('/user/:email').get(controller.getUser) // user with username
router.route('/generateOTP').get(controller.verifyUser, localVariables, controller.generateOTP) //generate random OTP
router.route('/verifyOTP').get(controller.verifyOTP) // verify generated OTP
router.route('/createResetSession').get(controller.createResetSession) // reset all variables
//-- GET Categories
router.route('/categories').get(CategoriesController.getcategories) //get all categories
router.route('/categories/:categoryname').get(CategoriesController.getsubcategories) //get all subcategries in a category
//-- GET Courses
router.route('/courses').get(CoursesController.getCourses) //get all subcategries in a category
router.route('/course/:coursename').get(CoursesController.getCourseBySlug) //get all subcategries in a category
router.route('/getcart').get(controller.verifyUser, CoursesController.getcart) //get a cart
router.route('/getwishlist').get(controller.verifyUser, CoursesController.getwishlist) //get a wishlist


/** PUT Methods */
router.route('/updateuser').put(Auth, controller.updateUser); // is use to update the user profile
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword) // used to reset password
router.route('/purchasecourse').put( Auth,CoursesController.purchasedCourse)

export default router