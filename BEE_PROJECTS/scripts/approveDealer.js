/**
 * DEALER APPROVAL SCRIPT
 * Usage: node scripts/approveDealer.js dealer@email.com
 * 
 * This script approves a dealer account so they can login to the dealer portal
 * In a real app, this would be done through an admin panel with authentication
 * 
 * WHY THIS SCRIPT?
 * - Dealers register with isApproved: false
 * - Dealers cannot login until isApproved: true
 * - Admin needs a way to approve new dealer registrations
 * - This script simulates admin approval action
 */

import connectDB from '../src/config/db.js'
import Dealer from '../src/models/dealerModel.js'
import mongoose from 'mongoose'

const email = process.argv[2]

if (!email) {
    console.log('Usage: node scripts/approveDealer.js <dealer-email>')
    console.log('Example: node scripts/approveDealer.js dealer@luxurycars.com')
    process.exit(1)
}

const approveDealer = async () => {
    try {
        // Connect to MongoDB
        await connectDB()
        console.log('Connected to MongoDB')

        // Find dealer by email and update isApproved to true
        const dealer = await Dealer.findOneAndUpdate(
            { email },
            { isApproved: true },
            { new: true }
        )

        if (!dealer) {
            console.log(`❌ Dealer not found with email: ${email}`)
            process.exit(1)
        }

        console.log(`Dealer approved successfully!`)
        console.log(`   Name: ${dealer.name}`)
        console.log(`   Email: ${dealer.email}`)
        console.log(`   Dealership: ${dealer.dealershipName}`)
        console.log(`   Status: isApproved = ${dealer.isApproved}`)
        console.log(`\n   Dealer can now login at: http://localhost:3000/dealer/login`)

        await mongoose.disconnect()
    } catch (error) {
        console.error('Error approving dealer:', error.message)
        process.exit(1)
    }
}

approveDealer()
