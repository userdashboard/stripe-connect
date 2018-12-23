const stripe = require('stripe')()

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.metadata.submitted ||
        stripeAccount.metadata.accountid !== req.account.accountid ||
        !stripeAccount.verification.fields_needed ||
        !stripeAccount.verification.fields_needed.length) {
      throw new Error('invalid-stripe-account')
    }
    req.stripeAccount = stripeAccount
  },
  patch: async (req) => {
    const updateInfo = {
      legal_entity: {}
    }
    for (const pathAndField of req.stripeAcount.verification.fields_needed) {
      const parts = pathAndField.split('.')
      const secondObject = parts[1]
      const field = parts[parts.length - 1]
      switch (secondObject) {
        case 'address':
        case 'address_kana':
        case 'address_kanji':
        case 'personal_address':
        case 'personal_address_kana':
        case 'personal_address_kanji':
          updateInfo.legal_entity[secondObject] = updateInfo.legal_entity[secondObject] || {}
          updateInfo.legal_entity[secondObject][field] = req.body[field]
          break
        default:
          updateInfo.legal_entity[field] = req.body[field]
          break
      }
    }
    try {
      await stripe.accounts.update(req.query.stripeid, updateInfo, req.stripeKey)
      req.success = true
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
