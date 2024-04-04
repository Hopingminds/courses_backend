import passport from 'passport'
import {Router} from 'express'
const router = Router()

import * as authController from '../controllers/AuthController.js'

router.route('/google').get(passport.authenticate('google'))
router.route('/google/callback').get(passport.authenticate('google', { failureRedirect: process.env.CLIENT_BASE_URL }), authController.loginCallback)

router.route('/linkedin').get(passport.authenticate('linkedin'))
router.route('/linkedin/callback').get(passport.authenticate('linkedin', { failureRedirect: process.env.CLIENT_BASE_URL }), authController.loginCallback)

export default router