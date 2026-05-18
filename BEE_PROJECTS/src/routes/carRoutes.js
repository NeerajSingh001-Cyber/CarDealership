import { Router } from 'express'
import {
  getAllCars,
  getCarById,
  getCarStats,
  getFilteredCars,
  getSortedCars,
  renderCarPreview
} from '../controllers/carController.js'

const router = Router()

router.get('/filter', getFilteredCars)
router.get('/sort', getSortedCars)
router.get('/stats', getCarStats)
router.get('/preview/:id', renderCarPreview)
router.get('/:id', getCarById)
router.get('/', getAllCars)

export default router
