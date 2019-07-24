const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body || !req.body.reason) {
      throw new Error('invalid-reason')
    }
    if (req.body.reason !== 'fraud' && req.body.reason !== 'other' && req.body.reason !== 'terms_of_service') {
      throw new Error('invalid-reason')
    }
    const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    const updateInfo = {
      reason: req.body.reason
    }
    try {
      const accountNow = await stripe.accounts.reject(req.query.stripeid, updateInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
      return accountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
