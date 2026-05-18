import bcrypt from 'bcrypt'
import Car from '../models/carModel.js'
import User from '../models/userModel.js'
import asyncHandler from '../utils/asyncHandler.js'
import { hashPassword, generateToken } from '../services/userService.js'

const toPublicUser = (user) => ({
  id: String(user._id),
  username: user.username,
  email: user.email
})

const getCarsDataset = async () => Car.find({}).lean()

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  const normalizedUsername = String(username || '').trim()
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedUsername || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Username, email and password are required.' })
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email.' })
  }

  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!pattern.test(String(password || ''))) {
    return res.status(400).json({
      error: 'Password must be at least 8 chars with uppercase, lowercase and number.'
    })
  }

  const existingUser = await User.findByEmail(normalizedEmail)

  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' })
  }

  const hashedPassword = await hashPassword(password)
  const user = new User({ username: normalizedUsername, email: normalizedEmail, password: hashedPassword })

  await user.save().catch((error) => {
    if (error && error.code === 11000) {
      error.statusCode = 409
      error.message = 'User already exists'
    } else if (error?.name === 'ValidationError') {
      error.statusCode = 400
    }
    throw error
  })

  return res.status(201).json({
    id: user._id.toString(),
    username: user.username,
    email: user.email
  })
})

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPassword = String(password || '')

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const user = await User.findByEmail(normalizedEmail)

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const isMatch = await bcrypt.compare(normalizedPassword, user.password)
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  const token = generateToken(String(user._id))
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  return req.login(user, (loginError) => {
    if (loginError) {
      return res.status(500).json({ error: 'Failed to create session.' })
    }

    req.session.user = { id: user._id, username: user.username, email: user.email }
    return res.status(200).json({
      token,
      user: user.getPublicProfile()
    })
  })
})

export const logoutUser = asyncHandler(async (req, res) => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      res.clearCookie('connect.sid', { path: '/' })
      res.status(200).json({ message: 'Logged out successfully' })
      return resolve()
    }

    req.session.destroy((error) => {
      if (error) {
        return reject(error)
      }

      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      res.clearCookie('connect.sid', { path: '/' })
      res.status(200).json({ message: 'Logged out successfully' })
      return resolve()
    })
  })
})

export const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user?.getPublicProfile?.() || req.session.user

  if (!user) {
    return res.redirect('/HTML/homepage.html')
  }

  const cars = await getCarsDataset()
  return res.render('dashboard', { user, cars })
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user?.getPublicProfile?.() || req.session.user
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  return res.status(200).json({ user })
})

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.status(200).json(isMongoConnected() ? user.getPublicProfile() : toPublicUser(user))
})

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  return res.status(200).json(users.map((user) => user.getPublicProfile()))
})

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id)

  if (!deleted) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.status(200).json({ message: 'User deleted successfully' })
})

export const getLegacyUsers = asyncHandler(async (req, res) => {
  const { email, password } = req.query
  const users = await User.find({}).lean()
  const findByEmail = async (normalizedEmail) => User.findByEmail(normalizedEmail)

  if (!email && !password) {
    const output = users.map((user) => ({
      id: String(user._id),
      username: user.username,
      email: user.email,
      password: user.password
    }))
    return res.status(200).json(output)
  }

  if (email && !password) {
    const user = await findByEmail(String(email).trim().toLowerCase())
    if (!user) return res.status(200).json([])

    return res.status(200).json([
      {
        id: String(user._id),
        username: user.username,
        email: user.email,
        password: user.password
      }
    ])
  }

  const user = await findByEmail(String(email || '').trim().toLowerCase())
  if (!user) {
    return res.status(200).json([])
  }

  const isMatch = await bcrypt.compare(String(password || ''), user.password)
  if (!isMatch) {
    return res.status(200).json([])
  }

  return res.status(200).json([
    {
      id: String(user._id),
      username: user.username,
      email: user.email,
      password: user.password
    }
  ])
})
