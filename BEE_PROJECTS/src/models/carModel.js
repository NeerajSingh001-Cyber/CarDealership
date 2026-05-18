import mongoose from 'mongoose'

const carSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    type: { type: String, default: '' },
    fuel: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    engine: { type: String, default: '' },
    horsepower: { type: String, default: '' },
    seats: { type: String, default: '' },
    mileage: { type: String, default: '' },
    topspeed: { type: String, default: '' },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dealer',
      default: null
      // null = car was seeded via seedCars.js
      // ObjectId = car was added by a dealer via POST /api/dealer/cars
      // Allows populate() to show which dealer added which car
    }
  },
  { timestamps: true }
)

const Car = mongoose.models.Car || mongoose.model('Car', carSchema)

export default Car
