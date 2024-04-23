import passport from 'passport'
import jwt from 'jsonwebtoken'
import UserModel from '../model/User.model.js'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2'

function generateToken(user) {
	return jwt.sign(
		{
			userID: user._id,
			email: user.email,
			role: user.role
		},
		process.env.JWT_SECRET,
		{ expiresIn: '24h' }
	);
}

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: `${process.env.SERVER_BASE_URL}/auth/google/callback`,
			scope: ['profile', 'email']
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				let user = await UserModel.findOne({ email: profile.emails[0].value });

				if (user) {
					const token = generateToken(user);
					await UserModel.updateOne({ email: user.email }, { token });
					return done(null, { token });
				} else {
					user = new UserModel({
						password: 'itsNotAPassword!',
						email: profile.emails[0].value,
						name: profile.displayName,
						isProfileComplete: false
					});
					await user.save();
					const token = generateToken(user);
					await UserModel.updateOne({ email: user.email }, { token });
					return done(null, { token });
				}
			} catch (error) {
				return done(null, false, { message: 'Internal Server Error - Error Saving Token' });
			}
		}
	)
);

passport.use(
	new LinkedInStrategy(
		{
			clientID: process.env.LINKEDIN_CLIENT_ID,
			clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
			callbackURL: `${process.env.SERVER_BASE_URL}/auth/linkedin/callback`,
			scope: ['openid', 'profile', 'email']
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				let user = await UserModel.findOne({ email: profile.email });
				if (user) {
					const token = generateToken(user);
					await UserModel.updateOne({ email: user.email }, { token });
					return done(null, { token });
				} else {
					user = new UserModel({
						password: null,
						email: profile.email,
						name: profile.displayName,
						isProfileComplete: false
					});
					await user.save();
					const token = generateToken(user);
					await UserModel.updateOne({ email: user.email }, { token });
					return done(null, { token });
				}
			} catch (error) {
				return done(error);
			}
		}
	)
);


// Serialize user
passport.serializeUser((user, done) => {
	done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
	done(null, user);
});
