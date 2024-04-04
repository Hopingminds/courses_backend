export async function loginWithGoogleCallback(req, res) {
	if (req.user.token) {
		res.redirect(`${process.env.CLIENT_BASE_URL}/login?token=${req.user.token}`);
	} else{
		res.redirect(`${process.env.CLIENT_BASE_URL}/register?name=${req.user.name}&email=${req.user.name}`);
	}
}
