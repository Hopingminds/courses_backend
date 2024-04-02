import passport from 'passport'
import jwt from 'jsonwebtoken'
import UserModel from '../model/User.model.js'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: `${process.env.SERVER_BASE_URL}/auth/google/callback`,
		},
		async function (accessToken, refreshToken, profile, done) {
			try {
				const user = await UserModel.findOne({
					email: profile.emails[0].value,
				})

				if (user) {
					const token = jwt.sign(
							{
								userID: user._id,
								email: user.email,
								role: user.role,
							},
							process.env.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						
						UserModel.updateOne({ email: user.email }, { token })
						.exec()
						.then(()=>{
							return done(null, { token })
						})
						.catch((error)=>{
							return done(null, false, {
								message: 'Internal Server Error - Error Saving Token',
							})
						})
				} else {
					return done(null, false, {
						message: 'User not found in the database',
					})
				}
			} catch (err) {
				return done(err)
			}
		}
	)
)

// Serialize user
passport.serializeUser(function (user, done) {
	done(null, user) // Store the entire user object in the session
})

// Deserialize user
passport.deserializeUser(function (obj, done) {
	done(null, obj) // Retrieve the entire user object from the session
})
