const connect = require('../../../../../index.js')
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
    if (!stripeAccount.metadata.representtive ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration) {
      throw new Error('invalid-registration')
    }
    const representativeInfo = {
      relationship: {
        representative: false
      }
    }
    try {
      await stripe.accounts.createPerson(req.query.stripeid, representativeInfo, req.stripeKey)
      req.success = true
      const stripeAccountNow = await stripe.accounts.update(req.query.stripeid, {
        metadata: {
          representative: null
        }
      }, req.stripeKey)
      await stripeCache.update(stripeAccountNow)
      req.success = true
      return stripeAccountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
