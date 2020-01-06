const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    while (true) {
      try {
        await stripe.accounts.del(req.query.stripeid, req.stripeKey)
        await stripeCache.delete(req.query.stripeid)
        req.success = true
        return true
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
      }
    }
  }
}
