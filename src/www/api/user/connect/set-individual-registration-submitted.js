const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    if (stripeAccount.requirements.currently_due.length > 0) {
      for (const field of stripeAccount.requirements.currently_due) {
        if (!field.startsWith('tos_acceptance')) {
          throw new Error('invalid-registration')
        }
      }
    }
    const accountInfo = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.headers['user-agent'] || 'None',
        date: dashboard.Timestamp.now
      }
    }
    const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
    await stripeCache.delete(req.query.stripeid)
    return stripeAccountNow
  }
}
