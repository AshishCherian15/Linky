import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { getCachedUrl, setCachedUrl } from '../services/cache.js'

const prisma = global.prisma as PrismaClient
const redis = global.redis

export async function redirectHandler(req: Request, res: Response) {
  const { shortcode } = req.params

  if (!shortcode || shortcode.length < 4) {
    return res.status(404).json({ error: 'Not found' })
  }

  try {
    // Check Redis cache first
    const cachedUrl = await getCachedUrl(redis, shortcode)
    if (cachedUrl) {
      // Log click asynchronously (fire-and-forget)
      logClick(shortcode, req).catch(console.error)
      return res.redirect(302, cachedUrl)
    }

    // Cache miss → query Postgres
    const link = await prisma.publicLink.findUnique({
      where: { shortCode: shortcode },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Check expiry
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Link has expired' })
    }

    // Populate cache
    await setCachedUrl(redis, shortcode, link.longUrl)

    // Log click asynchronously
    logClick(shortcode, req).catch(console.error)

    // Redirect
    res.redirect(302, link.longUrl)
  } catch (error) {
    console.error('Redirect error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function logClick(shortcode: string, req: Request) {
  try {
    const link = await prisma.publicLink.findUnique({
      where: { shortCode: shortcode },
      select: { id: true },
    })

    if (!link) return

    // Parse user agent for device type
    const userAgent = req.headers['user-agent'] || ''
    let deviceType = 'desktop'
    if (/mobile/i.test(userAgent)) deviceType = 'mobile'
    else if (/tablet/i.test(userAgent)) deviceType = 'tablet'

    // Hash IP for privacy (never store raw IP)
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const ipHash = Buffer.from(ip).toString('base64').slice(0, 16)

    await prisma.click.create({
      data: {
        linkId: link.id,
        referrer: req.headers.referer || null,
        deviceType,
        ipHash,
      },
    })
  } catch (error) {
    console.error('Click logging error:', error)
  }
}
