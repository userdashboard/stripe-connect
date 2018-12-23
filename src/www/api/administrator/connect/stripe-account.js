const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let stripeAccount
    try {
      stripeAccount = await stripeCache.retrieve(req.query.stripeid, 'accounts', req.stripeKey)
    } catch (error) {
    }
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    return stripeAccount
  }
}
