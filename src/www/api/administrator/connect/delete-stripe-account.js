const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    await stripeCache.execute('accounts', 'del', req.query.stripeid, req.stripeKey)
    await stripeCache.delete(req.query.stripeid)
    return true
  }
}
