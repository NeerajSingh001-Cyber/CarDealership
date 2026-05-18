import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import User from '../models/userModel.js'

const isMongoConnected = () => mongoose.connection.readyState === 1

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        if (!isMongoConnected()) {
          return done(null, false, { message: 'Local auth strategy unavailable without MongoDB.' })
        }

        const user = await User.findByEmail(String(email || '').trim().toLowerCase())
        if (!user) {
          return done(null, false, { message: 'Invalid credentials.' })
        }

        const isMatch = await bcrypt.compare(String(password || ''), user.password)
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials.' })
        }

        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, String(user._id))
})

passport.deserializeUser(async (id, done) => {
  try {
    if (!isMongoConnected()) {
      return done(null, null)
    }

    const user = await User.findById(id)
    return done(null, user || null)
  } catch (error) {
    return done(error)
  }
})
