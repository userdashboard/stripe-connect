const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    if (stripeAccount.business_type === 'company') {
      if (stripeAccount.metadata.requiresOwners === 'true' && !stripeAccount.company.owners_provided) {
        throw new Error('invalid-beneficial-owner')
      }
      if (stripeAccount.metadata.requiresDirectors === 'true' && !stripeAccount.company.directors_provided) {
        throw new Error('invalid-company-director')
      }
      req.query.all = true
      const persons = await global.api.user.connect.Persons.get(req)
      if (persons && persons.length) {
        for (const person of persons) {
          if (person.requirements.currently_due.length) {
            throw new Error('invalid-person')
          }
        }
      }
    }
    if (stripeAccount.requirements.currently_due.length) {
      for (const field of stripeAccount.requirements.currently_due) {
        if (field !== 'tos_acceptance.date' &&
            field !== 'tos_acceptance.ip') {
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
