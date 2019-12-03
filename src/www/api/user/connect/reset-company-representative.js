const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const representatives = await stripe.accounts.listPersons(req.query.stripeid, {
      relationship: {
        representative: true
      }
    }, req.stripeKey)
    if (!representatives || !representatives.data || !representatives.data.length) {
      return
    }
    try {
      await stripe.accounts.updatePerson(req.query.stripeid, representatives.data[0].id, { 
        relationship: {
          representative: false
        }
      })
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}