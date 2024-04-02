import {Router} from 'express'
const router = Router()

import * as authController from '../controllers/AuthController.js'

router.route('/google').get(authController.loginWithGoogle)
router.route('/google/callback').get(authController.loginWithGoogleCallback)

export default router