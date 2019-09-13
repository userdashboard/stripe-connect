const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
let cache

module.exports = {
  get: async (req) => {
    if (!cache) {
      cache = await stripe.countrySpecs.list({ limit: 100 }, req.stripeKey)
    }
    return cache.data
  }
}
