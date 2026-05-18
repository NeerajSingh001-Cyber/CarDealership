import mongoose from 'mongoose'
import connectDB from '../src/config/db.js'
import Car from '../src/models/carModel.js'
const seedCars = async () => {
  await connectDB()
  await Car.deleteMany({})
  const inserted = await Car.insertMany(cars)
  await mongoose.disconnect()
}
seedCars().catch(async (error) => {
  console.error('Seed failed:', error.message)
  await mongoose.disconnect()
  process.exit(1)
})
