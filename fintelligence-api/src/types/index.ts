export interface PlaidTokenExchangeBody {
  publicToken: string
}

export interface TransactionQueryParams {
  limit?: string
  offset?: string
  category?: string
  startDate?: string
  endDate?: string
}

export interface StripeCheckoutBody {
  priceId?: string
}
