import asyncHandler from '../utils/asyncHandler.js'
import UserMessage from '../models/userMessageModel.js'

export const createContactMessage = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const subject = String(req.body.subject || '').trim()
  const message = String(req.body.message || '').trim()

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email.' })
  }

  const contactMessage = await UserMessage.create({
    name,
    email,
    subject,
    message
  })

  return res.status(201).json({
    message: 'Your message has been sent successfully.',
    data: {
      id: String(contactMessage._id),
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      message: contactMessage.message,
      createdAt: contactMessage.createdAt
    }
  })
})