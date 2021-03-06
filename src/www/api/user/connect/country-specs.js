const stripeCache = require('../../../../stripe-cache.js')
let cache

module.exports = {
  auth: false,
  get: async (req) => {
    if (!cache) {
      cache = await stripeCache.execute('countrySpecs', 'list', { limit: 100 }, req.stripeKey)
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
