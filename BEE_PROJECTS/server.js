import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './src/app.js'
import connectDB from './src/config/db.js'
import { PORT } from './src/config/keys.js'
import Enquiry from './src/models/enquiryModel.js'
import Car from './src/models/carModel.js'


const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
})

const carViewers = {}
const socketCarMembership = new Map()

const getRoomName = (carId) => `car-${carId}`

const decrementViewer = (carId) => {
    if (!carId) return
    if (!carViewers[carId]) return

    carViewers[carId] = Math.max(0, carViewers[carId] - 1)
    if (carViewers[carId] === 0) {
        delete carViewers[carId]
    }

    io.to(getRoomName(carId)).emit('viewerCount', {
        carId,
        count: carViewers[carId] || 0
    })
}

io.on('connection', (socket) => {
    console.log(`New socket connected: ${socket.id}`)
    socketCarMembership.set(socket.id, new Set())

    socket.on('viewCar', (carId) => {
        if (!carId) return

        const joinedCars = socketCarMembership.get(socket.id) || new Set()
        if (joinedCars.has(carId)) {
            io.to(getRoomName(carId)).emit('viewerCount', {
                carId,
                count: carViewers[carId] || 0
            })
            return
        }

        socket.join(getRoomName(carId))
        joinedCars.add(carId)
        socketCarMembership.set(socket.id, joinedCars)
        carViewers[carId] = (carViewers[carId] || 0) + 1
        io.to(getRoomName(carId)).emit('viewerCount', { carId, count: carViewers[carId] })
    })

    socket.on('sendEnquiry', ({ carId, username, email, message }) => {
        // For security: require that the socket handshake contains a session cookie
        const cookies = String(socket.handshake.headers.cookie || '')
        const hasSessionCookie = cookies.includes('connect.sid') || cookies.includes('token=')

        if (!hasSessionCookie) {
            console.warn('sendEnquiry rejected: unauthenticated socket (no session cookie)')
            socket.emit('enquiryAck', { ok: false, error: 'not_authenticated' })
            return
        }

        // For now, socket-based enquiries are only real-time broadcasts (no DB persistence)
        console.log('Socket sendEnquiry received (not persisted):', { carId, username, email, message })

        if (!carId || !username || !message) {
            console.warn('sendEnquiry missing required fields, ignoring')
            socket.emit('enquiryAck', { ok: false, error: 'missing_fields' })
            return
        }

        // Broadcast to car room in real time
        io.to(getRoomName(carId)).emit('newEnquiry', {
            username,
            message,
            timestamp: new Date().toISOString()
        })

        // Acknowledge to sender that message was broadcast (not persisted)
        socket.emit('enquiryAck', { ok: true, persisted: false })
    })

    socket.on('leaveCar', (carId) => {
        if (!carId) return

        socket.leave(getRoomName(carId))
        const joinedCars = socketCarMembership.get(socket.id)
        if (joinedCars && joinedCars.has(carId)) {
            joinedCars.delete(carId)
            decrementViewer(carId)
        }
    })

    socket.on('disconnect', () => {
        const joinedCars = socketCarMembership.get(socket.id)
        if (joinedCars) {
            for (const carId of joinedCars) {
                decrementViewer(carId)
            }
        }
        socketCarMembership.delete(socket.id)
        console.log(`Socket disconnected: ${socket.id}`)
    })
})

const startServer = async () => {
    try {
        await connectDB()
        httpServer.listen(PORT, () => {
            console.log(`Your server is running at port ${PORT}`)
        })
    } catch (error) {
        console.error('Server startup aborted because MongoDB connection failed.')
        process.exit(1)
    }
}

startServer()
