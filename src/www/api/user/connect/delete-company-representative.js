const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.metadata.representative ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const representativeInfo = {
      relationship: {
        representative: false
      }
    }
    try {
      await stripe.accounts.updatePerson(req.query.stripeid, stripeAccount.metadata.representative, representativeInfo, req.stripeKey)
      req.success = true
    } catch (error) {
      if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
    }
    while (true) {
      try {
        const stripeAccountNow = await stripe.accounts.update(req.query.stripeid, {
          metadata: {
            representative: null
          }
        }, req.stripeKey)
        await stripeCache.update(stripeAccountNow)
        req.success = true
        return stripeAccountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
      }
    }
  }
}
