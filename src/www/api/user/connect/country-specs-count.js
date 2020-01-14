const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
let cache

module.exports = {
  get: async (req) => {
    if (!cache) {
      while (true) {
        try {
          const items = await stripe.countrySpecs.list({ limit: 100 }, req.stripeKey)
          if (items && items.data.length) {
            cache = items.data.length
            return cache
          }
        } catch (error) {
          if (error.raw && error.raw.code === 'lock_timeout') {
            continue
          }
          if (error.raw && error.raw.code === 'rate_limit') {
            continue
          }
          if (error.raw && error.raw.code === 'idempotency_key_in_use') {
            continue
          }
          if (error.type === 'StripeConnectionError') {
            continue
          }
          throw error
        }
      }
    }
  }
}
