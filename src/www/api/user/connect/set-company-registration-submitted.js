const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    if (!stripeAccount.company.owners_provided) {
      throw new Error('invalid-registration')
    }
    if (!stripeAccount.company.directors_provided) {
      throw new Error('invalid-registration')
    }
    
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration) {
      throw new Error('invalid-registration')
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].company
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!registration[posted]) {
        if (field === 'company.address.line2' ||
          (field === 'business_profile.url' && registration.business_profile_product_description) ||
          (field === 'business_profile.product_description' && registration.business_profile_url)) {
          continue
        }
        throw new Error('invalid-registration')
      }
    }
    const accountInfo = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      business_profile: {},
      company: {
        address: {},
        owners_provided: true
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
    }
    if (global.stripeJS === 3) {
      accountInfo.token = registration.companyToken
      delete (accountInfo.company)
      delete (accountInfo.business_profile)
    } else {
      for (const field in registration) {
        if (field.startsWith('business_profile_')) {
          const property = field.substring('business_profile_'.length)
          accountInfo.business_profile[property] = registration[field]
          continue
        }
        if (field.startsWith('company_')) {
          if (field.startsWith('company_address_kanji_')) {
            const property = field.substring('company_address_kanji_'.length)
            accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
            accountInfo.company.address_kanji[property] = registration[field]
          } else if (field.startsWith('company_address_kana_')) {
            const property = field.substring('company_address_kana_'.length)
            accountInfo.company.address_kana = accountInfo.company.address_kana || {}
            accountInfo.company.address_kana[property] = registration[field]
          } else if (field.startsWith('company_address_')) {
            const property = field.substring('company_address_'.length)
            accountInfo.company.address[property] = registration[field]
          } else if (field.startsWith('company_name_')) {
            const property = field.substring('company_name_'.length)
            accountInfo.company[`name_${property}`] = registration[field]
          } else {
            const property = field.substring('company_'.length)
            accountInfo.company[property] = registration[field]
          }
        }
      }
    }
    try {
      stripeAccount = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(stripeAccount)
      return stripeAccount
    } catch (error) {
      const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
      if (errorMessage.startsWith('company[address]')) {
        let field = errorMessage.substring('company[address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}`)
      } else if (errorMessage.startsWith('company[personal_address]')) {
        let field = errorMessage.substring('company[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('company[address_kana]')) {
        let field = errorMessage.substring('company[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}_kana`)
      } else if (errorMessage.startsWith('company[address_kanji]')) {
        let field = errorMessage.substring('company[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}_kanji`)
      } else if (errorMessage.startsWith('company')) {
        let field = errorMessage.substring('company['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      }
      throw new Error('unknown-error')
    }
  }
}
