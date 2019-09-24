const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      !stripeAccount.requirements.fields_needed ||
      !stripeAccount.requirements.fields_needed.length) {
      throw new Error('invalid-stripe-account')
    }
    const updateInfo = {
      legal_entity: {}
    }
    // req.query.country = stripeAccount.country
    // const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    // const requiredFields = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
    // for (const field of requiredFields) {
    //   switch (field) {
    //     case 'address':
    //     case 'address_kana':
    //     case 'address_kanji':
    //     case 'personal_address':
    //     case 'personal_address_kana':
    //     case 'personal_address_kanji':
    //       updateInfo.legal_entity[secondObject] = updateInfo.legal_entity[secondObject] || {}
    //       updateInfo.legal_entity[secondObject][field] = req.body[field]
    //       break
    //     default:
    //       updateInfo.legal_entity[field] = req.body[field]
    //       break
    //   }
    // }
    try {
      await stripe.accounts.update(req.query.stripeid, updateInfo, req.stripeKey)
      req.success = true
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
