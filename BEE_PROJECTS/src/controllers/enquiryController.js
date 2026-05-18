import asyncHandler from '../utils/asyncHandler.js'
import Enquiry from '../models/enquiryModel.js'
import Car from '../models/carModel.js'

// POST /api/enquiries
// Creates an enquiry (used by Buy Now button) — requires logged-in user session
const createEnquiry = asyncHandler(async (req, res) => {
  const user = req.user?.getPublicProfile?.() || req.session.user
  if (!user) return res.status(401).json({ error: 'Not authenticated' })

  const { carId, message } = req.body
  if (!carId) return res.status(400).json({ error: 'carId is required' })

  const car = await Car.findOne({ id: carId })
  const carName = car?.name || 'Unknown Car'

  const enquiry = new Enquiry({
    carId,
    carName,
    username: user.username || 'Anonymous',
    email: user.email || 'anonymous',
    message: message || 'Interested in buying this car'
  })

  await enquiry.save()

  return res.status(201).json({ message: 'Enquiry created', enquiry })
})

export { createEnquiry }
