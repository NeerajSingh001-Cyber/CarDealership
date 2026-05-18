import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import session from 'express-session'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import userRoutes from './routes/userRoutes.js'
import carRoutes from './routes/carRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import dealerRoutes from './routes/dealerRoutes.js'
import enquiryRoutes from './routes/enquiryRoutes.js'
import sellRequestRoutes from './routes/sellRequestRoutes.js'
import logger from './middlewares/logger.js'
import errorMiddleware from './middlewares/errorMiddleware.js'
import attachDealer from './middlewares/attachDealer.js'
import './config/passport.js'
import { MONGO_URI } from './config/keys.js'
import isAuthenticated from './middlewares/isAuthenticated.js'
import {
  getAllCars,
  getCarById,
  renderInventory
} from './controllers/carController.js'
import {
  getDashboard,
  getLegacyUsers,
  registerUser
} from './controllers/userController.js'
import {
  getDealerDashboard,
  getDealerLoginPage
} from './controllers/dealerController.js'
const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(__dirname, '../..')

app.set('view engine', 'ejs')
app.set('views', path.join(projectRoot, 'src', 'views'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
const sessionOptions = {
  secret: process.env.JWT_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}

if (process.env.SESSION_STORE === 'mongo' && MONGO_URI) {
  const mongoSessionStore = MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60
  })

  mongoSessionStore.on('error', (error) => {
    console.error('Mongo session store error:', error.message)
  })

  sessionOptions.store = mongoSessionStore
  console.log('Session store: MongoDB')
} else {
  console.log('Session store: Memory (set SESSION_STORE=mongo to enable Mongo sessions)')
}

app.use(session(sessionOptions))
app.use(passport.initialize())
app.use(passport.session())
app.use(attachDealer)
app.use(morgan('dev'))
app.use(logger)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  return next()
})

app.use('/HTML', express.static(path.join(workspaceRoot, 'HTML')))
app.use('/CSS', express.static(path.join(workspaceRoot, 'CSS')))
app.use('/MEDIA', express.static(path.join(workspaceRoot, 'MEDIA')))
app.use('/JS', express.static(path.join(workspaceRoot, 'JS')))
app.use(express.static(workspaceRoot))
app.use('/api/users', userRoutes)
app.use('/api/cars', carRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/dealer', dealerRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/sell-requests', sellRequestRoutes)
app.get('/inventory', renderInventory)
app.get('/users', getLegacyUsers)
app.post('/users', registerUser)
app.get('/getallcardetails', getAllCars)
app.get('/cars', getAllCars)
app.get('/cars/:id', getCarById)
app.get('/dashboard', isAuthenticated, getDashboard)
app.get('/dealer/login', getDealerLoginPage)
app.get('/dealer/dashboard', getDealerDashboard)

app.get('/', (req, res) => res.redirect('/HTML/homepage.html'))

app.use(errorMiddleware)

export default app
