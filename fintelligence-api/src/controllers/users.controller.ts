import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getMe(req: Request, res: Response): Promise<void> {
  // req.userId is now the DB User.id (set by JWT middleware)
  const user = await prisma.user.findUnique({ where: { id: req.userId } })

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json(user)
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const { name, email, firstName, lastName } = req.body as {
    name?: string
    email?: string
    firstName?: string
    lastName?: string
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
    },
  })

  res.json(user)
}
