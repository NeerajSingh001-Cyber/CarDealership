import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/keys.js'

/**
 * DEALER MIDDLEWARE — Protects dealer-only API routes
 * 
 * DIFFERENCE FROM OTHER MIDDLEWARE:
 * authMiddleware.js: checks for user token cookie, no role verification
 * dealerMiddleware.js: checks for dealerToken cookie, verifies role === 'dealer' in JWT
 * isAuthenticated.js: checks Passport session for SSR pages
 * 
 * This middleware:
 * 1. Checks for dealerToken cookie OR Authorization header
 * 2. Verifies JWT signature with JWT_SECRET
 * 3. Confirms role is 'dealer' (not 'user')
 * 4. Attaches decoded token (with dealer id) to req.dealer
 * 5. Calls next() to proceed to route handler
 */

const dealerMiddleware = (req, res, next) => {
    // Get token from either cookie or Authorization header
    const token = req.cookies?.dealerToken ||
                  req.headers.authorization?.split(' ')[1]

    // No token found
    if (!token) {
        return res.status(401).json({ error: 'Dealer access required. Please login.' })
    }

    try {
        // Verify and decode JWT token
        const decoded = jwt.verify(token, JWT_SECRET)

        // Check that decoded token has role === 'dealer'
        if (decoded.role !== 'dealer') {
            return res.status(403).json({ error: 'Access denied. Not a dealer account.' })
        }

        // Attach decoded token to req.dealer for use in route handlers
        // decoded contains: { id: dealer._id, role: 'dealer', iat, exp }
        req.dealer = decoded

        next()
    } catch (error) {
        // Invalid signature or expired token
        return res.status(401).json({ error: 'Invalid or expired dealer token' })
    }
}

export default dealerMiddleware
