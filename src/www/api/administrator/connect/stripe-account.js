const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await stripeCache.retrieve(req.query.stripeid, 'accounts', req.stripeKey)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    return stripeAccount
  }
}
