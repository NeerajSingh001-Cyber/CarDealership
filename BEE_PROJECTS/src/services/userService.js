import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/keys.js'

export const hashPassword = async (password) => bcrypt.hash(String(password || ''), 10)

export const generateToken = (userId) =>
  jwt.sign({ userId: String(userId) }, JWT_SECRET, { expiresIn: '7d' })
