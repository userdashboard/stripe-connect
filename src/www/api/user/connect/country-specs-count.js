const stripeCache = require('../../../../stripe-cache.js')
let cache

module.exports = {
  get: async (req) => {
    if (!cache) {
      const items = await stripeCache.execute('countrySpecs', 'list', { limit: 100 }, req.stripeKey)
      if (items && items.data.length) {
        cache = items.data.length
      }
    }
    return cache
  }
}
