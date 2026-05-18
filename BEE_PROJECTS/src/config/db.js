import 'dotenv/config'
import mongoose from 'mongoose'
import { MONGO_URI } from './keys.js'

const connectDB = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not set')
  }

  try {
    const connection = await mongoose.connect(MONGO_URI)
    console.log(`MongoDB connected: ${connection.connection.host}`)
    return connection
  } catch (error) {
    console.error('MongoDB connection failed.')
    console.error(error.message)
    throw error
  }
}

export default connectDB
