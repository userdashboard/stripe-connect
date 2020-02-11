
const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')
const cache = {}

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.country) {
      throw new Error('invalid-country')
    }
    if (!connect.countrySpecIndex[req.query.country]) {
      throw new Error('invalid-country')
    }
    if (cache[req.query.country]) {
      return cache[req.query.country]
    }
    const countrySpec = cache[req.query.country] = await stripeCache.execute('countrySpecs', 'retrieve', req.query.country, req.stripeKey)
    if (!countrySpec) {
      throw new Error('invalid-country')
    }
    return countrySpec
  }
}
