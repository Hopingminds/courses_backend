export async function loginWithGoogleCallback(req, res) {
	res.redirect(`${process.env.CLIENT_BASE_URL}?token=${req.user.token}`);
}
