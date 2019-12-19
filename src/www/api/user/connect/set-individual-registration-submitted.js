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
    if (!registration) {
      throw new Error('invalid-registration')
    }
    if (!registration.individual_verification_document_front) {
      throw new Error('invalid-individual_verification_document_front')
    }
    if (!registration.individual_verification_document_back) {
      throw new Error('invalid-individual_verification_document_back')
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].individual
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!registration[posted]) {
        if (field === 'individual.address.line2' ||
            field === 'individual.verification.document.front' ||
            field === 'individual.verification.document.back' ||
            field === 'individual.verification.additional_document.front' ||
            field === 'individual.verification.additional_document.back' ||
          (field === 'business_profile.url' && registration.business_profile_product_description) ||
          (field === 'business_profile.product_description' && registration.business_profile_url)) {
          continue
        }
        throw new Error('invalid-registration')
      }
    }
    const accountInfo = {
    }
    if (global.stripeJS === 3) {
      accountInfo.account_token = registration.individualToken
      delete (registration.individualToken)
    } else {
      accountInfo.business_profile = {}
      accountInfo.individual = {
        verification: {},
        address: {},
        dob: {}
      }
      accountInfo.tos_acceptance = {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
      accountInfo.metadata = {
        submitted: dashboard.Timestamp.now
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
          accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
          const property = field.substring('individual_verification_document_'.length)
          accountInfo.individual.verification.document[property] = registration[field]
        } else if (field.startsWith('individual_verification_additional_document_')) {
          accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
          const property = field.substring('individual_verification_additional_document_'.length)
          accountInfo.individual.verification.additional_document[property] = registration[field]
        } else if (field.startsWith('individual_')) {
          const property = field.substring('individual_'.length)
          accountInfo.individual[property] = registration[field]
        } else if (field.startsWith('business_profile_')) {
          const property = field.substring('business_profile_'.length)
          accountInfo.business_profile[property] = registration[field]
        } else {
          accountInfo[field] = registration[field]
        }
        delete (registration[field])
      }
    }
    if (global.stripeJS !== 3) {
      connect.MetaData.store(stripeAccount.metadata, 'registration', registration)
      for (const field in stripeAccount.metadata) {
        if (field.startsWith('registration')) {
          accountInfo.metadata[field] = stripeAccount.metadata[field]
        }
      }
    }
    let stripeAccountNow
    try {
      stripeAccountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(stripeAccountNow)
    } catch (error) {
      const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
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
    if (global.stripeJS !== 3) {
      return stripeAccountNow
    }
    const accountInfoNow = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
    }
    for (const field in registration) {
      if (field.startsWith('business_profile_')) {
        const property = field.substring('business_profile_'.length)
        accountInfoNow.business_profile = accountInfoNow.business_profile || {}
        accountInfoNow.business_profile[property] = registration[field]
        delete (registration[field])
        continue
      }
      if (!field.startsWith('individual_')) {
        continue
      }
      delete (registration[field])
    }
    connect.MetaData.store(stripeAccount.metadata, 'registration', registration)
    for (const field in stripeAccount.metadata) {
      if (field.startsWith('registration')) {
        accountInfoNow.metadata[field] = stripeAccount.metadata[field]
      }
    }
    while (true) {
      try {
        stripeAccountNow = await stripe.accounts.update(req.query.stripeid, accountInfoNow, req.stripeKey)
        await stripeCache.update(stripeAccountNow)
        return stripeAccountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
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
        } else if (errorMessage.startsWith('company[verification]')) {
          let field = errorMessage.substring('company[verification][document]['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-company_verification_document_${field}`)
        } else if (errorMessage.startsWith('company')) {
          let field = errorMessage.substring('company['.length)
          field = field.substring(0, field.length - 1)
          throw new Error(`invalid-company_${field}`)
        }
        throw new Error('unknown-error')
      }
    }
  }
}
