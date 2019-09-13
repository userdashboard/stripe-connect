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
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads && req.uploads['individual_verification_document_front']) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['individual_verification_document_back'].name,
          data: req.uploads['individual_verification_document_back'].buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body['individual_verification_document_front'] = file.id
      } catch (error) {
        throw new Error('invalid-individual_verification_document_front')
      }
    }
    if (req.uploads && req.uploads['individual_verification_document_back']) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['individual_verification_document_back'].name,
          data: req.uploads['individual_verification_document_back'].buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body['individual_verification_document_back'] = file.id
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    const requiredFields = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    if (req.body['individual_verification_document_back']) {
      registration['individual_verification_document_back'] = req.body['individual_verification_document_back']
    }
    if (req.body['individual_verification_document_front']) {
      registration['individual_verification_document_front'] = req.body['individual_verification_document_front']
    }
    for (const field of requiredFields) {
      if (field === 'business_type' ||
        field === 'external_account' ||
        field === 'individual.verification.document' ||
        field === 'tos_acceptance.date' ||
        field === 'tos_acceptance.ip') {
        continue
      }
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    const accountInfo = {
      metadata: {}
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
