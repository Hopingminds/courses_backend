import passport from 'passport'

export async function loginWithGoogleCallback(req, res) {
	// Successful authentication, send response with JWT token
	res.json({ token: req.user })
}
