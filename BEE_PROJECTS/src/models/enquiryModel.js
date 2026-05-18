import mongoose from 'mongoose'

/**
 * ENQUIRY MODEL — Stores user inquiries about cars persistently
 * 
 * WHY SAVE ENQUIRIES TO MONGODB?
 * Socket.io handles real-time delivery to connected clients
 * But Socket.io messages are only in memory — lost when server restarts
 * MongoDB persistence allows dealers to view enquiries even if they were offline
 * This creates a complete audit trail of all customer inquiries
 */

const enquirySchema = new mongoose.Schema({
    carId: {
        type: Number,
        required: true
        // Numeric car id matching the Car model's id field
        // Users send enquiry from /cardetails/:id page
    },
    carName: {
        type: String,
        required: true
        // Car name captured at time of enquiry
        // Stored redundantly so dealer can see car name even if car is deleted
    },
    username: {
        type: String,
        required: true
        // User's name from the frontend
    },
    email: {
        type: String,
        required: true
        // User's email — dealer can contact them back
    },
    message: {
        type: String,
        required: true,
        minlength: 5
        // User's inquiry message — minimum 5 characters
    },
    status: {
        type: String,
        enum: ['pending', 'responded', 'closed'],
        default: 'pending'
        // pending = dealer hasn't responded yet
        // responded = dealer read and replied
        // closed = inquiry resolved
    },
    respondedAt: {
        type: Date,
        default: null
        // When dealer marked it as 'responded'
        // Null if still pending
    }
}, { timestamps: true })
// timestamps: true automatically adds createdAt and updatedAt

export default mongoose.model('Enquiry', enquirySchema)
