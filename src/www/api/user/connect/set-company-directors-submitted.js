const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      (stripeAccount.company && stripeAccount.company.directors_provided)) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.requiresDirectors) {
      throw new Error('invalid-stripe-account')
    }
    const accountInfo = {
      company: {
        directors_provided: true
      }
    }
    const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
    await stripeCache.delete(req.query.stripeid)
    return stripeAccountNow
  }
}
