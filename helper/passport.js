import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";

passport.use(
	new GoogleStrategy(
		{
			clientID:'9847485605-ak5uav3eg0ehlsrr00hs6q3nngdofbh1.apps.googleusercontent.com',
			clientSecret: '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',
			callbackURL: 'http://localhost:8080/auth/google/callback',
		},
		function (accessToken, refreshToken, profile, done) {
			// Here you can save the user to your database or perform any necessary operations
			console.log(profile)
			return done(null, profile)
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