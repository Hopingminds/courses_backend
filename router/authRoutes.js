import passport from 'passport'
import {Router} from 'express'
const router = Router()

import * as authController from '../controllers/AuthController.js'

router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'] }))
router.route('/google/callback').get(passport.authenticate('google', { failureRedirect: process.env.CLIENT_BASE_URL }), authController.loginWithGoogleCallback)

export default router