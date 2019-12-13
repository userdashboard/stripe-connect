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
    if (!req.body) {
      throw new Error('invalid_company_name')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
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
           (field === 'business_profile.product_description' && req.body.business_profile_url)) {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    if (req.body.business_profile_mcc) {
      const mccList = connect.getMerchantCategoryCodes(req.language)
      let found = false
      for (const mcc of mccList) {
        found = mcc.code === req.body.business_profile_mcc
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-business_profile_mcc')
      }
    }
    if (req.body.business_profile_url) {
      if (!req.body.business_profile_url.startsWith('http://') &&
          !req.body.business_profile_url.startsWith('https://')) {
        throw new Error('invalid-business_profile_url')
      }
    }
    if (req.body.company_address_state) {
      const states = connect.countryDivisions[stripeAccount.country]
      if (!states || !states.length) {
        throw new Error('invalid-company_address_state')
      }
      let found = false
      for (const state of states) {
        found = state.value === req.body.company_address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-company_address_state')
      }
    }
    const accountInfo = {
      metadata: {
      }
    }
    if (global.stripeJS === 3) {
      registration.companyToken = req.body.token
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
