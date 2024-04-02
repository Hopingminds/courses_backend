import passport from "passport";
import UserModel from "../model/User.model";

export async function loginWithGoogle(req, res) {
    passport.authenticate('google', { scope: ['profile', 'email'] })
}

export async function loginWithGoogleCallback(req, res) {
    passport.authenticate('google', { failureRedirect: '/' }),
	function (req, res) {
		// Successful authentication, send response with JWT token
		res.json({ token: req.user })
	}
}