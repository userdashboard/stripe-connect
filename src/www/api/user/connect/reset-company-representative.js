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
    const persons = await stripe.accounts.listPersons(req.query.stripeid, { limit: 100 }, req.stripeKey)
    for (const person of persons.data) {
      if (!person.relationship.representative) {
        continue
      }
      const representativeInfo = {
        relationship: {
          representative: false
        }
      }
      try {
        await stripe.accounts.updatePerson(req.query.stripeid, person.id, representativeInfo, req.stripeKey)
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
    throw new Error('unknown-error')
  }
}
