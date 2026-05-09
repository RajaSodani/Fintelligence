import type { Request, Response } from 'express'
import { stripe } from '../config/stripe'
import * as stripeService from '../services/stripe.service'

export async function createCheckoutSession(req: Request, res: Response): Promise<void> {
  const userEmail = req.userEmail ?? ''
  const url = await stripeService.createCheckoutSession(req.userId, userEmail)
  res.json({ url })
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    res.status(400).json({ error: 'Webhook signature verification failed' })
    return
  }

  await stripeService.handleWebhookEvent(event)
  res.json({ received: true })
}

export async function getSubscription(req: Request, res: Response): Promise<void> {
  const data = await stripeService.getSubscriptionStatus(req.userId)
  res.json(data)
}
