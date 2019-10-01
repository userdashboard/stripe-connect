const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
let cache

module.exports = {
  get: async (req) => {
    if (!cache) {
      cache = await stripe.countrySpecs.list({ limit: 100 }, req.stripeKey)
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
