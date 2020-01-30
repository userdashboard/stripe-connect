const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
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
    let countrySpec
    while (true) {
      try {
        countrySpec = cache[req.query.country] = await stripe.countrySpecs.retrieve(req.query.country, req.stripeKey)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.raw && error.raw.code === 'resource_missing') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.type === 'StripeAPIError') {
          continue
        }
        if (error.message === 'An error occurred with our connection to Stripe.') {
          continue
        }
        break
      }
    }
    if (!countrySpec) {
      throw new Error('invalid-country')
    }
    return countrySpec
  }
}
