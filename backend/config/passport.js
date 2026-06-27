// ─────────────────────────────────────────────────────────────
//  passport.js — Authentication Strategies
//
//  Passport is a Node.js auth library. We configure 2 strategies:
//
//  1. LOCAL STRATEGY — email + password login
//     Passport checks credentials against MongoDB
//
//  2. GOOGLE STRATEGY — Google SSO
//     User clicks "Login with Google"
//     → redirected to Google
//     → Google sends back profile (email, name, photo)
//     → we find or create user in MongoDB
//     → return user object
// ─────────────────────────────────────────────────────────────

const passport         = require('passport');
const LocalStrategy    = require('passport-local').Strategy;
const GoogleStrategy   = require('passport-google-oauth20').Strategy;
const bcrypt           = require('bcryptjs');
const User             = require('../models/User');

// ── LOCAL STRATEGY ─────────────────────────────────────────
passport.use(new LocalStrategy(
  { usernameField: 'email' }, // use email instead of default "username"
  async (email, password, done) => {
    try {
      // 1. Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return done(null, false, { message: 'No account found with that email.' });

      // 2. Check if user registered via Google (no password set)
      if (!user.password) return done(null, false, { message: 'Please log in with Google.' });

      // 3. Compare password with hashed password in DB
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

      // 4. Success — return user
      return done(null, user);

    } catch (err) {
      return done(err);
    }
  }
));

// ── GOOGLE STRATEGY ────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const photo = profile.photos[0]?.value || '';

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User exists — update photo and return
        user.photo = photo;
        await user.save();
        return done(null, user);
      }

      // Check if email already registered (local account)
      user = await User.findOne({ email });
      if (user) {
        // Link Google to existing account
        user.googleId = profile.id;
        user.photo    = photo;
        await user.save();
        return done(null, user);
      }

      // New user — create account
      user = await User.create({
        googleId:  profile.id,
        name:      profile.displayName,
        email:     email,
        photo:     photo,
        role:      'analyst', // default role
        authType:  'google',
      });

      return done(null, user);

    } catch (err) {
      return done(err);
    }
  }
));

// Serialize: what to store in session (just the user ID)
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize: look up full user from session ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
