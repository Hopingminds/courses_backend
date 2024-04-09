import {Router} from 'express'
const router = Router()

import * as controller from '../controllers/appController.js'
import * as CoursesController from '../controllers/CoursesController.js'

// POST ROUTES
router.route('/addtocart').post(controller.verifyUser, CoursesController.addToCart);
router.route('/deleteCart').post(controller.verifyUser, CoursesController.deleteCart);
router.route('/removefromcart').post(controller.verifyUser, CoursesController.removeFromCart);

router.route('/addtowishlist').post(controller.verifyUser, CoursesController.addtowishlist);
router.route('/removefromwishlist').post(controller.verifyUser, CoursesController.removeFromWishlist);

// GET ROUTES
router.route('/getcart').get(controller.verifyUser, CoursesController.getcart)
router.route('/getwishlist').get(controller.verifyUser, CoursesController.getwishlist)

// PUT ROUTES

// DELETE ROUTES

export default router