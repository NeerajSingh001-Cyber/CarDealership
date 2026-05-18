import { Router } from 'express'
import {
  deleteUser,
  getAllUsers,
  getUserById,
  loginUser,
  logoutUser,
  registerUser
  , getCurrentUser
} from '../controllers/userController.js'

const router = Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.get('/me', getCurrentUser)
router.get('/', getAllUsers)
router.get('/:id', getUserById)
router.delete('/:id', deleteUser)

export default router
