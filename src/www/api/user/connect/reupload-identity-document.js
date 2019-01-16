const stripe = require('stripe')()

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.file || !req.file.id) {
      throw new Error('invalid-upload')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (!stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      !stripeAccount.legal_entity.verification.details_code) {
      throw new Error('invalid-stripe-account')
    }
  },
  patch: async (req) => {
    if (!req.file) {
      throw new Error('invalid-upload')
    }
    const accountInfo = {
      legal_entity: {
        document: req.file.id
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      return accountNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
