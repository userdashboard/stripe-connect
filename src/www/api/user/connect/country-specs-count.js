const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
let cache

module.exports = {
  get: async (req) => {
    if (!cache) {
      const items = await stripe.countrySpecs.list({ limit: 100 }, req.stripeKey)
      if (items && items.length) {
        cache = items.data.length
      }
    }
    return cache
  }
}
