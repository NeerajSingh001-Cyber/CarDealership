import mongoose from 'mongoose'

const userMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true }
  },
  {
    timestamps: true,
    collection: 'userMessage'
  }
)

const UserMessage = mongoose.models.UserMessage || mongoose.model('UserMessage', userMessageSchema)

export default UserMessage