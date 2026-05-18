import express from 'express'
import { createEnquiry } from '../controllers/enquiryController.js'

const router = express.Router()

// POST /api/enquiries — create enquiry from Buy Now
router.post('/', createEnquiry)

export default router
