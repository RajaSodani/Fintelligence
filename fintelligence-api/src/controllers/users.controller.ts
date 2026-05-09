import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getMe(req: Request, res: Response): Promise<void> {
  let user = await prisma.user.findUnique({ where: { clerkId: req.userId } })

  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: req.userId, email: req.userEmail ?? `${req.userId}@placeholder.com` },
    })
  }

  res.json(user)
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const { name, email } = req.body as { name?: string; email?: string }

  const user = await prisma.user.update({
    where: { clerkId: req.userId },
    data: { ...(name && { name }), ...(email && { email }) },
  })

  res.json(user)
}
