import passport from 'passport'
import {Router} from 'express'
const router = Router()

import * as authController from '../controllers/AuthController.js'

router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get(
	'/google/callback',
	passport.authenticate('google', { failureRedirect: process.env.CLIENT_BASE_URL }),
	function (req, res) {
		// Successful authentication, send response with JWT token
		res.redirect(`${process.env.CLIENT_BASE_URL}?token=${req.user.token}`);
	}
)

export default router