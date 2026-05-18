/**
 * ATTACH DEALER MIDDLEWARE
 * Adds dealer from session to res.locals so EJS templates can access it
 * Similar to attachUser middleware
 * 
 * Usage in app.js:
 * app.use(attachDealer)
 * 
 * Usage in EJS:
 * <% if (dealer) { %>
 *     Welcome, <%= dealer.dealershipName %>
 * <% } %>
 */

const attachDealer = (req, res, next) => {
    res.locals.dealer = req.session?.dealer || null
    next()
}

export default attachDealer
