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
    if (stripeAccount.metadata.submitted || stripeAccount.business_type === 'individual') {
      throw new Error('invalid-stripe-account')
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].company
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'company.address.line2' ||
           (field === 'business_profile.url' && req.body.business_profile_product_description) ||
           (field === 'business_profile.product_description' && req.body.business_profile.url)) {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    if (req.body.company_address_state) {
      registration.company_address_state = req.body.company_address_state
    }
    if (req.body.company_address_line2) {
      registration.company_address_line2 = req.body.company_address_line2
    }
    const accountInfo = {
      metadata: {
      }
    }
    if (req.body.token) {
      registration.accountToken = req.body.token
    }
    connect.MetaData.store(accountInfo.metadata, 'registration', registration)
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(accountNow)
      return accountNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
