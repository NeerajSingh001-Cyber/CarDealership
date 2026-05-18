import asyncHandler from '../utils/asyncHandler.js'
import SellRequest from '../models/sellRequestModel.js'

// Authenticated endpoint to create sell request
const createSellRequest = asyncHandler(async (req, res) => {
  // User must be authenticated (checked by isAuthenticated middleware)
  // Try to get userId from session or Passport
  const userId = req.session?.user?.id || req.session?.user?._id || req.user?._id
  
  if (!userId) {
    return res.status(401).json({ error: 'Please log in to submit a sell request' })
  }

  const payload = req.body || {}

  // Basic validation
  const required = ['name', 'email', 'phone', 'state', 'city', 'make', 'model', 'fuel', 'about', 'consent']
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null || String(payload[key]).trim() === '') {
      return res.status(400).json({ error: `${key} is required` })
    }
  }

  const doc = new SellRequest({
    userId,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: String(payload.phone).trim(),
    state: payload.state,
    city: payload.city,
    make: payload.make,
    model: payload.model,
    fuel: payload.fuel,
    year: payload.year ? Number(payload.year) : undefined,
    km: payload.km ? Number(payload.km) : undefined,
    insurance: payload.insurance ? new Date(payload.insurance) : undefined,
    about: payload.about,
    filesCount: payload.filesCount ? Number(payload.filesCount) : 0,
    interestedBrand: payload.interestedBrand || '',
    interestedModel: payload.interestedModel || '',
    consent: Boolean(payload.consent)
  })

  await doc.save()

  return res.status(201).json({ message: 'Sell request received', sellRequest: doc })
})

export { createSellRequest }
