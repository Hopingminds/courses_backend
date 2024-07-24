import passport from 'passport'
import {Router} from 'express'
const router = Router()


const constructRedirectUrl = (baseUrl, redirect) => {
    return redirect ? `${baseUrl}?redirect=${redirect}` : baseUrl;
};

router.get("/login/success", (req, res) => {
	if (req.user) {
		res.status(200).json({
			error: false,
			message: "Successfully Loged In",
			user: req.user,
		});
	} else {
		res.status(403).json({ error: true, message: "Not Authorized" });
	}
});

router.get("/login/failed", (req, res) => {
	res.status(401).json({
		error: true,
		message: "Log in failure",
	});
});

router.get("/google", (req, res, next) => {
    const redirect = req.query.redirect;
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state: redirect
    })(req, res, next);
});

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/auth/login/failed",
    }),
    (req, res) => {
        const redirectUrl = req.query.state;
        res.redirect(constructRedirectUrl(process.env.CLIENT_BASE_URL, redirectUrl));
    }
);

router.get("/linkedin", (req, res, next) => {
    const redirect = req.query.redirect;
    passport.authenticate("linkedin", {
        state: redirect
    })(req, res, next);
});

router.get(
    "/linkedin/callback",
    passport.authenticate("linkedin", {
        failureRedirect: "/auth/login/failed",
    }),
    (req, res) => {
        const redirectUrl = req.query.state;
        res.redirect(constructRedirectUrl(process.env.CLIENT_BASE_URL, redirectUrl));
    }
);


router.get("/logout", (req, res) => {
	req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect(process.env.CLIENT_BASE_URL);
    });
});

router.get("/inslogout", (req, res) => {
	req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
    });
});

export default router