export async function loginCallback(req, res) {
	if (req.user.token) {
		res.cookie('user_token', req.user.token, { maxAge: 60000 })
		res.redirect(`${process.env.CLIENT_BASE_URL}/login?token=${req.user.token}`);
	} else{
		res.cookie('user_name', req.user.name, { maxAge: 60000 })
		res.cookie('user_email', req.user.email, { maxAge: 60000 })
		res.redirect(`${process.env.CLIENT_BASE_URL}/register?name=${req.user.name}&email=${req.user.email}`);
	}
}
