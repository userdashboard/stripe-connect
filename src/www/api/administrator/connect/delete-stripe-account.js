const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
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
    try {
      await stripe.accounts.del(req.query.stripeid, req.stripeKey)
      req.success = true
      await stripeCache.delete(req.query.stripeid)
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
