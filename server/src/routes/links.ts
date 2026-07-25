import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { generateShortcode, isValidShortcode } from '../services/shortcode.js'
import { invalidateCache } from '../services/cache.js'
import QRCode from 'qrcode'

const router = Router()
const prisma = global.prisma as PrismaClient

// Validation schemas
const createLinkSchema = z.object({
  longUrl: z.string().url(),
  title: z.string().min(1).max(200),
  customAlias: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const updateLinkSchema = z.object({
  customAlias: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

// POST /api/links - Create a public link
router.post('/', async (req, res) => {
  try {
    const body = createLinkSchema.parse(req.body)
    
    // For now, we'll use a placeholder user ID
    // TODO: Replace with actual auth user ID after implementing auth
    const userId = req.body.userId || '00000000-0000-0000-0000-000000000000'

    let shortCode: string

    if (body.customAlias) {
      if (!isValidShortcode(body.customAlias)) {
        return res.status(400).json({ error: 'Invalid custom alias format' })
      }
      
      const existing = await prisma.publicLink.findUnique({
        where: { shortCode: body.customAlias },
      })
      
      if (existing) {
        return res.status(409).json({ error: 'Custom alias already taken' })
      }
      
      shortCode = body.customAlias
    } else {
      // Generate random shortcode with collision retry
      let retries = 0
      const maxRetries = 5
      
      do {
        shortCode = generateShortcode()
        const existing = await prisma.publicLink.findUnique({
          where: { shortCode },
        })
        
        if (!existing) break
        retries++
      } while (retries < maxRetries)
      
      if (retries >= maxRetries) {
        return res.status(500).json({ error: 'Failed to generate unique shortcode' })
      }
    }

    const link = await prisma.publicLink.create({
      data: {
        userId,
        shortCode,
        longUrl: body.longUrl,
        title: body.title,
        customAlias: !!body.customAlias,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    res.status(201).json(link)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/links - List current user's public links
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId as string || '00000000-0000-0000-0000-000000000000'
    
    const links = await prisma.publicLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    })

    res.json(links)
  } catch (error) {
    console.error('List links error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/links/:id - Get link detail + analytics summary
router.get('/:id', async (req, res) => {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    res.json(link)
  } catch (error) {
    console.error('Get link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/links/:id - Edit alias / expiry
router.patch('/:id', async (req, res) => {
  try {
    const body = updateLinkSchema.parse(req.body)
    
    const link = await prisma.publicLink.findUnique({
      where: { id: req.params.id },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const updateData: any = {}
    
    if (body.customAlias !== undefined) {
      if (body.customAlias && !isValidShortcode(body.customAlias)) {
        return res.status(400).json({ error: 'Invalid custom alias format' })
      }
      
      if (body.customAlias && body.customAlias !== link.shortCode) {
        const existing = await prisma.publicLink.findUnique({
          where: { shortCode: body.customAlias },
        })
        
        if (existing) {
          return res.status(409).json({ error: 'Custom alias already taken' })
        }
        
        updateData.shortCode = body.customAlias
        updateData.customAlias = true
        // Invalidate old cache
        await invalidateCache(global.redis, link.shortCode)
      }
    }
    
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    }

    const updated = await prisma.publicLink.update({
      where: { id: req.params.id },
      data: updateData,
    })

    res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/links/:id
router.delete('/:id', async (req, res) => {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { id: req.params.id },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    await prisma.publicLink.delete({
      where: { id: req.params.id },
    })

    // Invalidate cache
    await invalidateCache(global.redis, link.shortCode)

    res.status(204).send()
  } catch (error) {
    console.error('Delete link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/links/:id/analytics - Clicks over time, referrers, devices
router.get('/:id/analytics', async (req, res) => {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { id: req.params.id },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const clicks = await prisma.click.findMany({
      where: { linkId: req.params.id },
      orderBy: { clickedAt: 'desc' },
      take: 100,
    })

    // Aggregate analytics
    const clicksOverTime: Record<string, number> = {}
    const referrers: Record<string, number> = {}
    const devices: Record<string, number> = {}

    clicks.forEach((click) => {
      const day = click.clickedAt.toISOString().slice(0, 10)
      clicksOverTime[day] = (clicksOverTime[day] || 0) + 1

      if (click.referrer) {
        try {
          const domain = new URL(click.referrer).hostname
          referrers[domain] = (referrers[domain] || 0) + 1
        } catch {
          referrers['direct'] = (referrers['direct'] || 0) + 1
        }
      } else {
        referrers['direct'] = (referrers['direct'] || 0) + 1
      }

      devices[click.deviceType || 'unknown'] = (devices[click.deviceType || 'unknown'] || 0) + 1
    })

    res.json({
      totalClicks: clicks.length,
      clicksOverTime,
      referrers,
      devices,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/links/:id/qrcode - Returns PNG
router.get('/:id/qrcode', async (req, res) => {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { id: req.params.id },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const shortUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/${link.shortCode}`
    const qrCode = await QRCode.toBuffer(shortUrl, {
      width: 300,
      margin: 2,
    })

    res.setHeader('Content-Type', 'image/png')
    res.send(qrCode)
  } catch (error) {
    console.error('QR code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
