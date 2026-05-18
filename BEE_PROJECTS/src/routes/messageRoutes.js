import { Router } from 'express'
import { createContactMessage } from '../controllers/contactMessageController.js'

const router = Router()

router.post('/', createContactMessage)

export default router