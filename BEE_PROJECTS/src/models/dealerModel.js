import mongoose from 'mongoose'

/**
 * DEALER MODEL — Separate from User model for these reasons:
 * 1. Different fields: dealershipName, dealershipAddress, isApproved, carsAdded
 * 2. Different permissions: dealers can add/edit/delete cars, view all enquiries
 * 3. Different authentication: separate JWT token, stored in dealerToken cookie
 * 4. Different dashboard: dealers see their own analytics and added cars
 */

const dealerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 8
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        dealershipName: {
            type: String,
            required: true,
            trim: true
        },
        dealershipAddress: {
            type: String,
            required: true
        },
        isApproved: {
            type: Boolean,
            default: false
            // Admin must approve dealer before they can login
        },
        carsAdded: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Car'
                // References Car documents — enables populate() for full car details
            }
        ]
    },
    { timestamps: true }
)

/**
 * Instance method: returns dealer profile without password
 */
dealerSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        dealershipName: this.dealershipName,
        dealershipAddress: this.dealershipAddress,
        isApproved: this.isApproved,
        carsAdded: this.carsAdded
    }
}

/**
 * Static method: find dealer by email
 */
dealerSchema.statics.findByEmail = function (email) {
    return this.findOne({ email })
}

export default mongoose.model('Dealer', dealerSchema)
