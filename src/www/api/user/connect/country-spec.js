const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
const cache = {}

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.country) {
      throw new Error('invalid-country')
    }
    if (cache[req.query.country]) {
      return cache[req.query.country]
    }
    while (true) {
      let countrySpec
      try {
        countrySpec = cache[req.query.country] = await stripe.countrySpecs.retrieve(req.query.country, req.stripeKey)
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
       if (error.type === 'StripeAPIError') {
          continue
       }
        throw error
      }
      if (!countrySpec) {
        throw new Error('invalid-country')
      }
      return countrySpec
    }
  }
}
