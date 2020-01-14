const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
let cache

module.exports = {
  auth: false,
  get: async (req) => {
    if (!cache) {
      while (true) {
        try {
          cache = await stripe.countrySpecs.list({ limit: 100 }, req.stripeKey)
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
        if (cache) {
          break
        }
      }
    }
    req.query = req.query || {}
    if (req.query.all) {
      return cache.data
    }
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
    const result = []
    let skipped = 0
    for (const countrySpec of cache.data) {
      if (skipped < offset) {
        skipped++
        continue
      }
      result.push(countrySpec)
      if (result.length === limit) {
        return result
      }
    }
    return result
  }
}
