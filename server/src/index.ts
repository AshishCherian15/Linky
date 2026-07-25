import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createClient } from 'ioredis'
import authRoutes from './routes/auth.js'
import linkRoutes from './routes/links.js'
import { redirectHandler } from './controllers/redirect.js'
import { rateLimit } from './middleware/rateLimit.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

// Make prisma and redis available globally
declare global {
  var prisma: PrismaClient
  var redis: ReturnType<typeof createClient>
}

global.prisma = prisma
global.redis = redis

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public redirect route (no auth required)
app.get('/:shortcode', redirectHandler)

// API routes
app.use('/api/auth', authRoutes)
// Apply rate limiting to link creation (10 requests per minute)
app.use('/api/links', rateLimit(redis, { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'create_link' }))
app.use('/api/links', linkRoutes)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Linky server running on port ${PORT}`)
})
