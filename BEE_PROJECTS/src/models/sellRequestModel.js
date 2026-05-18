import mongoose from 'mongoose'

const sellRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  fuel: { type: String, required: true },
  year: { type: Number },
  km: { type: Number },
  insurance: { type: Date },
  about: { type: String },
  filesCount: { type: Number, default: 0 },
  interestedBrand: { type: String, default: '' },
  interestedModel: { type: String, default: '' },
  consent: { type: Boolean, default: false },
  status: { type: String, enum: ['new', 'reviewed', 'closed'], default: 'new' }
}, { timestamps: true })

export default mongoose.model('SellRequest', sellRequestSchema, 'sellRequests')
