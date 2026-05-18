import express from 'express'
import { createSellRequest } from '../controllers/sellRequestController.js'
import isAuthenticated from '../middlewares/isAuthenticated.js'

const router = express.Router()

// POST /api/sell-requests - requires authentication
router.post('/', isAuthenticated, createSellRequest)

export default router
