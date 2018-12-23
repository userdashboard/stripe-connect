const stripe = require('stripe')()
let cache

module.exports = {
  get: async (req) => {
    cache = cache || await stripe.countrySpecs.list({limit: 100}, req.stripeKey)
    return cache.data
  }
}
