import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
)

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email || '').trim().toLowerCase() })
}

userSchema.methods.getPublicProfile = function getPublicProfile() {
  return {
    id: String(this._id),
    username: this.username,
    email: this.email
  }
}

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
