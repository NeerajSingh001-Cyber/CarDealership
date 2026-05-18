import Dealer from '../models/dealerModel.js'
import Car from '../models/carModel.js'
import Enquiry from '../models/enquiryModel.js'
import User from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import asyncHandler from '../utils/asyncHandler.js'
import { JWT_SECRET } from '../config/keys.js'

/**
 * REGISTER DEALER
 * POST /api/dealer/register
 * Creates a new dealer account
 * isApproved starts as false — admin approval required before login
 */
const registerDealer = asyncHandler(async (req, res) => {
    const { name, email, password, phone, dealershipName, dealershipAddress } = req.body

    // Check if all required fields are present
    if (!name || !email || !password || !phone || !dealershipName || !dealershipAddress) {
        return res.status(400).json({ error: 'All fields are required' })
    }

    // Check if password is at least 8 characters
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Try to create the dealer
    try {
            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10)
        
        const dealer = new Dealer({
            name,
            email,
            password: hashedPassword,
            phone,
            dealershipName,
            dealershipAddress
        })

        await dealer.save()

        return res.status(201).json({
            message: 'Dealer account created successfully. Waiting for admin approval.',
            dealer: dealer.getPublicProfile()
        })
    } catch (error) {
        // MongoDB duplicate key error on email field
        if (error.code === 11000 && error.keyPattern.email) {
            return res.status(400).json({ error: 'Email already registered as a dealer' })
        }
        throw error
    }
})

/**
 * LOGIN DEALER
 * POST /api/dealer/login
 * Authenticates dealer and creates JWT token
 * Only approved dealers can login
 */
const loginDealer = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
    }

    // Find dealer by email using the static method
    const dealer = await Dealer.findByEmail(email)

    if (!dealer) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if dealer is approved
    if (!dealer.isApproved) {
        return res.status(403).json({ error: 'Your account is pending approval. Please wait for admin approval.' })
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, dealer.password)

    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token with dealer id and role
    const token = jwt.sign(
        { id: dealer._id, role: 'dealer' },
        JWT_SECRET,
        { expiresIn: '7d' }
    )

    // Set HTTP-only cookie with token named 'dealerToken'
    res.cookie('dealerToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Store dealer in session for EJS templates
    req.session.dealer = dealer.getPublicProfile()

    return res.status(200).json({
        message: 'Login successful',
        token,
        dealer: dealer.getPublicProfile()
    })
})

/**
 * LOGOUT DEALER
 * POST /api/dealer/logout
 * Clears dealer token and session
 */
const logoutDealer = asyncHandler(async (req, res) => {
    res.clearCookie('dealerToken')
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' })
        }
        return res.status(200).json({ message: 'Logout successful' })
    })
})

/**
 * GET DEALER LOGIN PAGE
 * GET /dealer/login
 * Renders dealer login form
 */
const getDealerLoginPage = asyncHandler(async (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session?.dealer) {
        return res.redirect('/dealer/dashboard')
    }
    res.render('pages/dealer/login')
})

/**
 * GET DEALER DASHBOARD
 * GET /dealer/dashboard
 * SSR page — check session, fetch data, render dashboard
 */
const getDealerDashboard = asyncHandler(async (req, res) => {
    // Check if dealer is logged in via session
    if (!req.session?.dealer) {
        return res.redirect('/dealer/login')
    }

    const dealerId = req.session.dealer.id

    // Fetch all necessary data in parallel
    const SellRequest = (await import('../models/sellRequestModel.js')).default
    const [totalCars, myCars, pendingEnquiries, totalUsers, dealer, totalSellRequests, sellRequests] = await Promise.all([
        Car.countDocuments(),
        Car.countDocuments({ addedBy: dealerId }),
        Enquiry.countDocuments({ status: 'pending' }),
        User.countDocuments(),
        Dealer.findById(dealerId).populate('carsAdded'),
        SellRequest.countDocuments(),
        SellRequest.find().sort({ createdAt: -1 })
    ])

    const stats = {
        totalCars,
        myCars,
        pendingEnquiries,
        totalUsers,
        totalSellRequests
    }

    // Fetch all cars, enquiries, and users for the dashboard
    const [cars, enquiries, users] = await Promise.all([
        Car.find().populate('addedBy', 'name dealershipName'),
        Enquiry.find().sort({ createdAt: -1 }),
        User.find().select('username email createdAt')
    ])

    res.render('pages/dealer/dashboard', {
        dealer: req.session.dealer,
        stats,
        cars,
        enquiries,
        users,
        sellRequests
    })
})

/**
 * ADD CAR
 * POST /api/dealer/cars
 * Dealer adds a new car to MongoDB
 * Auto-generates next numeric id
 */
const addCar = asyncHandler(async (req, res) => {
    const dealerId = req.dealer.id
    const { name, color, price, type, fuel, description, engine, horsepower, seats, mileage, topspeed, image } = req.body

    if (!name || !price || !type || !fuel) {
        return res.status(400).json({ error: 'Required fields: name, price, type, fuel' })
    }

    // Find maximum car id and generate next id
    const maxCar = await Car.findOne().sort({ id: -1 })
    const nextId = maxCar ? maxCar.id + 1 : 1

    // Create new car document
    const newCar = new Car({
        id: nextId,
        name,
        color,
        price,
        type,
        fuel,
        description,
        engine,
        horsepower,
        seats,
        mileage,
        topspeed,
        image: image || '',
        addedBy: dealerId
    })

    // Save car
    await newCar.save()

    // Add car ObjectId to dealer's carsAdded array and save dealer
    const dealer = await Dealer.findById(dealerId)
    dealer.carsAdded.push(newCar._id)
    await dealer.save()

    return res.status(201).json({
        message: 'Car added successfully',
        car: newCar
    })
})

/**
 * UPDATE CAR
 * PUT /api/dealer/cars/:id
 * Dealer updates car by numeric id
 */
const updateCar = asyncHandler(async (req, res) => {
    const { id } = req.params
    const updates = req.body

    // Find and update car by numeric id
    const updatedCar = await Car.findOneAndUpdate(
        { id: Number(id) },
        updates,
        { new: true, runValidators: true }
    )

    if (!updatedCar) {
        return res.status(404).json({ error: 'Car not found' })
    }

    return res.status(200).json({
        message: 'Car updated successfully',
        car: updatedCar
    })
})

/**
 * DELETE CAR
 * DELETE /api/dealer/cars/:id
 * Dealer deletes car by numeric id
 * Also removes from dealer's carsAdded array
 */
const deleteCar = asyncHandler(async (req, res) => {
    const { id } = req.params
    const dealerId = req.dealer.id

    // Find car by numeric id
    const car = await Car.findOne({ id: Number(id) })

    if (!car) {
        return res.status(404).json({ error: 'Car not found' })
    }

    // Delete car
    await Car.deleteOne({ id: Number(id) })

    // Remove car ObjectId from dealer's carsAdded array
    await Dealer.findByIdAndUpdate(
        dealerId,
        { $pull: { carsAdded: car._id } }
    )

    return res.status(200).json({ message: 'Car deleted successfully' })
})

/**
 * GET ALL ENQUIRIES
 * GET /api/dealer/enquiries
 * Returns all enquiries sorted by newest first
 */
const getAllEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 })

    return res.status(200).json({
        count: enquiries.length,
        enquiries
    })
})

/**
 * UPDATE ENQUIRY STATUS
 * PUT /api/dealer/enquiries/:id
 * Dealer marks enquiry as responded or closed
 */
const updateEnquiryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'responded', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be pending, responded, or closed' })
    }

    // Prepare update object
    const updateData = { status }
    if (status === 'responded') {
        updateData.respondedAt = new Date()
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    )

    if (!enquiry) {
        return res.status(404).json({ error: 'Enquiry not found' })
    }

    return res.status(200).json({
        message: 'Enquiry status updated',
        enquiry
    })
})

/**
 * GET DEALER PROFILE
 * GET /api/dealer/profile
 * Returns dealer's own profile with all added cars populated
 * .populate('carsAdded'): replaces ObjectId references with actual Car documents
 */
const getDealerProfile = asyncHandler(async (req, res) => {
    const dealerId = req.dealer.id

    // Find dealer and populate carsAdded with full car documents
    const dealer = await Dealer.findById(dealerId).populate('carsAdded')

    if (!dealer) {
        return res.status(404).json({ error: 'Dealer not found' })
    }

    return res.status(200).json({
        dealer: dealer.getPublicProfile()
    })
})

export {
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
}
