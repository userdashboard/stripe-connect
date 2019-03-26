const connect = require('../../../../../index.js')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted ||
        stripeAccount.individual ||
        stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec._get(req)
    req.data = { countrySpec, stripeAccount }
    if (req.file) {
      req.body = req.body || {}
      req.body.documentid = req.file.id
    }
    const requiredFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    for (const pathAndField of requiredFields) {
      let field = pathAndField.split('.').pop()
      if (field === 'external_account' ||
        field === 'type' ||
        field === 'additional_owners' ||
        field === 'ip' ||
        field === 'date' ||
        field === 'document') {
        continue
      }
      if (stripeAccount.country === 'JP') {
        if (pathAndField.startsWith('legal_entity.address_kana.') ||
            pathAndField.startsWith('legal_entity.personal_address_kana.')) {
          field += '_kana'
        } else if (pathAndField.startsWith('legal_entity.address_kanji.') ||
                   pathAndField.startsWith('legal_entity.personal_address_kanji.')) {
          field += '_kanji'
        }
      }
      if (pathAndField.startsWith('legal_entity.personal_address')) {
        field = `personal_${field}`
      } else if (pathAndField.startsWith('legal_entity.address')) {
        field = `company_${field}`
      }
      if (!req.body[field]) {
        throw new Error(`invalid-${field}`)
      }
    }
  },
  patch: async (req) => {
    const registration = connect.MetaData.parse(req.data.stripeAccount.metadata, 'registration') || {}
    const requiredFields = req.data.countrySpec.verification_fields.company.minimum.concat(req.data.countrySpec.verification_fields.company.additional)
    for (const pathAndField of requiredFields) {
      let field = pathAndField.split('.').pop()
      if (field === 'external_account' ||
        field === 'type' ||
        field === 'additional_owners' ||
        field === 'ip' ||
        field === 'date' ||
        field === 'document') {
        continue
      }
      if (req.data.stripeAccount.country === 'JP') {
        if (pathAndField.startsWith('legal_entity.address_kana.') ||
            pathAndField.startsWith('legal_entity.personal_address_kana.')) {
          field += '_kana'
        } else if (pathAndField.startsWith('legal_entity.address_kanji.') ||
                   pathAndField.startsWith('legal_entity.personal_address_kanji.')) {
          field += '_kanji'
        }
      }
      if (pathAndField.startsWith('legal_entity.personal_address')) {
        field = `personal_${field}`
      } else if (pathAndField.startsWith('legal_entity.address')) {
        field = `company_${field}`
      }
      registration[field] = req.body[field]
    }
    if (req.body.documentid) {
      registration.documentid = req.body.documentid
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'registration', registration)
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
