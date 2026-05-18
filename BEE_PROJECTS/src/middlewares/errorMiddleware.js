const errorMiddleware = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'

  return res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  })
}

export default errorMiddleware
