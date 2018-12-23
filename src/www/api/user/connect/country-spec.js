const stripe = require('stripe')()
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
    try {
      countrySpec = cache[req.query.country] = await stripe.countrySpecs.retrieve(req.query.country, req.stripeKey)
    } catch (error) {
    }
    if (!countrySpec) {
      throw new Error('invalid-country')
    }
    return countrySpec
  }
}
