import dotenv from 'dotenv'
dotenv.config()

export const SETU_BASE_URL = process.env.SETU_BASE_URL ?? 'https://fiu-sandbox.setu.co/v2'

export const setuHeaders = {
  'Content-Type': 'application/json',
  'x-client-id': process.env.SETU_CLIENT_ID ?? '',
  'x-client-secret': process.env.SETU_CLIENT_SECRET ?? '',
  'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID ?? '',
}
