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
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration || !registration.individual_verification_document_front) {
      throw new Error('invalid-individual_verification_document_front')
    } if (!registration.individual_verification_document_back) {
      throw new Error('invalid-individual_verification_document_back')
    }
    const requiredFields = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
    for (const field of requiredFields) {
      if (field === 'external_account' ||
        field === 'individual.verification.document' ||
        field === 'business_type' ||
        field === 'tos_acceptance.ip' ||
        field === 'tos_acceptance.date') {
        continue
      }
      const posted = field.split('.').join('_')
      if (!registration[posted]) {
        throw new Error('invalid-reegistration')
      }
    }
    const accountInfo = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      },
      business_profile: {},
      individual: {
        verification: {
          document: {}
        },
        address: {},
        dob: {}
      }
    }
    for (const field in registration) {
      if (field.startsWith('individual_address_')) {
        if (field.startsWith('individual_address_kana_')) {
          const property = field.substring('individual_address_kana_'.length)
          accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
          accountInfo.individual.address_kana[property] = registration[field]
        } else if (field.startsWith('individual_address_kanji_')) {
          const property = field.substring('individual_address_kanji_'.length)
          accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
          accountInfo.individual.address_kanji[property] = registration[field]
        } else {
          const property = field.substring('individual_address_'.length)
          accountInfo.individual.address[property] = registration[field]
        }
      } else if (field.startsWith('individual_dob_')) {
        const property = field.substring('individual_dob_'.length)
        accountInfo.individual.dob[property] = registration[field]
      } else if (field.startsWith('individual_verification_document_')) {
        const property = field.substring('individual_verification_document_'.length)
        accountInfo.individual.verification.document[property] = registration[field]
      } else if (field.startsWith('individual_')) {
        const property = field.substring('individual_'.length)
        accountInfo.individual[property] = registration[field]
      } else if (field.startsWith('business_profile_')) {
        const property = field.substring('business_profile_'.length)
        accountInfo.business_profile[property] = registration[field]
      } else {
        accountInfo[field] = registration[field]
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
    } catch (error) {
      const errorMessage = error.param ? error.raw.param : error.message
      if (errorMessage.startsWith('individual[address]')) {
        let field = errorMessage.substring('individual[address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('individual[personal_address]')) {
        let field = errorMessage.substring('individual[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('individual[address_kana]')) {
        let field = errorMessage.substring('individual[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kana`)
      } else if (errorMessage.startsWith('individual[address_kanji]')) {
        let field = errorMessage.substring('individual[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kanji`)
      } else if (errorMessage.startsWith('individual')) {
        let field = errorMessage.substring('individual['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      }
      throw new Error('unknown-error')
    }
  }
}
