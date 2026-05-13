import { stripe } from '../config/stripe'
import { PrismaClient } from '@prisma/client'
import type Stripe from 'stripe'

const prisma = new PrismaClient()

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
): Promise<string> {
  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail, metadata: { clerkId: userId } })
    customerId = customer.id
    await prisma.user.update({ where: { clerkId: userId }, data: { stripeCustomerId: customerId } })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: 'Fintelligence Pro', description: 'Unlimited AI chat, multi-agent research & more' },
          unit_amount: 999,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/settings?upgrade=success`,
    cancel_url: `${process.env.FRONTEND_URL}/settings?upgrade=cancelled`,
  })

  return session.url!
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const customerId = session.customer as string
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'pro' } })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'free' } })
    }
  }
}

export async function getSubscriptionStatus(clerkId: string): Promise<{ status: string }> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { subscriptionStatus: true },
  })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
  return { status: user.subscriptionStatus }
}
