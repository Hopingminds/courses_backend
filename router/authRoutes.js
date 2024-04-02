import passport from 'passport'
import {Router} from 'express'
const router = Router()

import * as authController from '../controllers/AuthController.js'

router.route('/google').get(passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get(
	'/google/callback',
	passport.authenticate('google', { failureRedirect: '/' }),
	function (req, res) {
		// Successful authentication, send response with JWT token
		res.json({ token: req.user.token });
	}
)

router.get('/logout', (req, res) => {
	req.logout(); // This clears the session and removes the user from the request object
	res.redirect('/'); // Redirect the user to the home page or any other desired page after logout
});

export default router