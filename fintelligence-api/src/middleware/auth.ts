import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../config/jwt'

// Self-driven JWT auth — Clerk code preserved below for easy switch-back
// To re-enable Clerk: comment this block, uncomment the Clerk block, and
// restore clerkClient import from '../config/clerk'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ── Clerk version (keep for future switch-back) ────────────────────────────
// import { clerkClient } from '../config/clerk'
//
// export async function requireAuth(req, res, next) {
//   const authHeader = req.headers.authorization
//   if (!authHeader?.startsWith('Bearer ')) {
//     res.status(401).json({ error: 'Missing or invalid Authorization header' })
//     return
//   }
//   const token = authHeader.slice(7)
//   try {
//     const payload = await clerkClient.verifyToken(token)
//     req.userId = payload.sub
//     next()
//   } catch {
//     res.status(401).json({ error: 'Invalid or expired token' })
//   }
// }
