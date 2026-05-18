const isAuthenticated = (req, res, next) => {
  const hasSessionUser = Boolean(req.session?.user)
  const hasPassportUser = typeof req.isAuthenticated === 'function' && req.isAuthenticated()

  if (hasSessionUser || hasPassportUser) {
    return next()
  }

  return res.status(401).json({ error: 'Authentication required' })
}

export default isAuthenticated
