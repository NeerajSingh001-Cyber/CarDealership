import express from 'express'
import dealerMiddleware from '../middlewares/dealerMiddleware.js'
import {
    registerDealer,
    loginDealer,
    logoutDealer,
    getDealerLoginPage,
    getDealerDashboard,
    addCar,
    updateCar,
    deleteCar,
    getAllEnquiries,
    updateEnquiryStatus,
    getDealerProfile
} from '../controllers/dealerController.js'

const router = express.Router()

/**
 * PUBLIC DEALER ROUTES (no authentication required)
 */

// POST /api/dealer/register
router.post('/register', registerDealer)

// POST /api/dealer/login
router.post('/login', loginDealer)

// GET /api/dealer/login — renders dealer login page
router.get('/login', getDealerLoginPage)

/**
 * PROTECTED DEALER ROUTES (dealerMiddleware required)
 * These routes check for valid dealerToken and role === 'dealer'
 */

// POST /api/dealer/logout
router.post('/logout', dealerMiddleware, logoutDealer)

// GET /api/dealer/profile — returns dealer profile with all cars
router.get('/profile', dealerMiddleware, getDealerProfile)

/**
 * CAR MANAGEMENT ROUTES (dealer-only)
 * Dealers can add, update, delete cars
 * Regular user /api/cars routes remain read-only
 */

// POST /api/dealer/cars — add new car
router.post('/cars', dealerMiddleware, addCar)

// PUT /api/dealer/cars/:id — update car by numeric id
router.put('/cars/:id', dealerMiddleware, updateCar)

// DELETE /api/dealer/cars/:id — delete car by numeric id
router.delete('/cars/:id', dealerMiddleware, deleteCar)

/**
 * ENQUIRY MANAGEMENT ROUTES (dealer-only)
 * Dealers view all enquiries and update their status
 */

// GET /api/dealer/enquiries — list all enquiries
router.get('/enquiries', dealerMiddleware, getAllEnquiries)

// PUT /api/dealer/enquiries/:id — update enquiry status
router.put('/enquiries/:id', dealerMiddleware, updateEnquiryStatus)

export default router
