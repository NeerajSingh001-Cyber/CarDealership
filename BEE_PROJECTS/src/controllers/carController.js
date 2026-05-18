import Car from '../models/carModel.js'
import asyncHandler from '../utils/asyncHandler.js'
import formatPrice from '../utils/formatPrice.js'

export const getAllCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({}).lean()
  return res.status(200).json({
    message: 'successfully get all car data',
    data: cars
  })
})

export const getCarById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const car = await Car.findOne({ id }).lean()

  if (!car) {
    return res.status(404).json({ error: 'data not found' })
  }

  return res.status(200).json({
    message: 'successfully retrieve car data',
    data: car
  })
})

export const getFilteredCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({}).lean()
  const filtered = cars.filter((car) => {
    if (req.query.type && car.type !== req.query.type) return false
    if (req.query.fuel && car.fuel !== req.query.fuel) return false
    return true
  })

  return res.status(200).json({
    message: 'filtered cars fetched successfully',
    data: filtered
  })
})

export const getSortedCars = asyncHandler(async (req, res) => {
  const by = req.query.by || 'price'
  const order = req.query.order === 'asc' ? 'asc' : 'desc'

  const cars = await Car.find({}).lean()
  const sorted = [...cars].sort((a, b) => {
    const left = a?.[by]
    const right = b?.[by]
    if (left === right) return 0
    if (order === 'asc') return left > right ? 1 : -1
    return left < right ? 1 : -1
  })

  return res.status(200).json({
    message: 'cars sorted successfully',
    data: sorted
  })
})

export const getCarStats = asyncHandler(async (req, res) => {
  const cars = await Car.find({}).lean()
  const totalCars = cars.length
  const totalPrice = cars.reduce((sum, car) => sum + Number(car.price || 0), 0)

  const countByTypeMap = cars.reduce((acc, car) => {
    acc[car.type] = (acc[car.type] || 0) + 1
    return acc
  }, {})

  const countByFuelMap = cars.reduce((acc, car) => {
    acc[car.fuel] = (acc[car.fuel] || 0) + 1
    return acc
  }, {})

  const countByType = Object.entries(countByTypeMap).map(([key, count]) => ({
    _id: key,
    count
  }))
  const countByFuel = Object.entries(countByFuelMap).map(([key, count]) => ({
    _id: key,
    count
  }))

  return res.status(200).json({
    totalCars,
    averagePrice: totalCars ? totalPrice / totalCars : 0,
    countByType,
    countByFuel
  })
})

export const renderInventory = asyncHandler(async (req, res) => {
  const cars = await Car.find({}).lean()
  return res.render('inventory', { cars, formatPrice })
})

export const renderCarPreview = asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const car = await Car.findOne({ id }).lean()

  if (!car) {
    const error = new Error('Car not found')
    error.statusCode = 404
    throw error
  }

  return res.render('carPreview', { car, formatPrice })
})
