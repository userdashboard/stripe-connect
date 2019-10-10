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
    if (req.uploads && req.uploads.relationship_account_opener_verification_document_front) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_account_opener_verification_document_front.name,
          data: req.uploads.relationship_account_opener_verification_document_front.buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body.relationship_account_opener_verification_document_front = file.id
      } catch (error) {
        throw new Error('invalid-relationship_account_opener_verification_document_front')
      }
    }
    if (req.uploads && req.uploads.relationship_account_opener_verification_document_back) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_account_opener_verification_document_back.name,
          data: req.uploads.relationship_account_opener_verification_document_back.buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body.relationship_account_opener_verification_document_back = file.id
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    req.query.country = stripeAccount.country
    const requiredFields = stripeAccount.requirements.currently_due.concat(stripeAccount.requirements.eventually_due)
    const openerFields = ['first_name', 'last_name', 'email', 'phone', 'dob_day', 'dob_month', 'dob_year', 'address_city', 'address_line1', 'address_postal_code']
    const openerOptional = ['address_line2', 'address_state', 'address_country']
    if (stripeAccount.country === 'US') {
      openerFields.push('ssn_last_4')
    }
    if (stripeAccount.country === 'JP') {
      openerFields.splice(openerFields.indexOf('address_city'), 1)
      openerFields.splice(openerFields.indexOf('address_state'), 1)
      openerFields.splice(openerFields.indexOf('address_country'), 1)
      openerFields.push('gender',
        'first_name_kana', 'last_name_kana', 'address_kana_state', 'address_kana_city', 'address_kana_town', 'address_kana_line1', 'address_kana_postal_code',
        'first_name_kanji', 'last_name_kanji', 'address_kanji_state', 'address_kanji_city', 'address_kanji_town', 'address_kanji_line1', 'address_kanji_postal_code')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    for (const field of requiredFields) {
      if (field === 'business_type' ||
        field === 'external_account' ||
        field === 'relationship.owner' ||
        field === 'relationship.director' ||
        field === 'tos_acceptance.date' ||
        field === 'tos_acceptance.ip') {
        continue
      }
      if (field === 'relationship.account_opener') {
        for (const personField of openerFields) {
          const posted = `relationship_account_opener_${personField}`
          if (!req.body[posted]) {
            throw new Error(`invalid-${posted}`)
          }
          if (personField === 'gender' && req.body.relationship_account_opener_gender !== 'female' && req.body.relationship_account_opener_gender !== 'male') {
            throw new Error(`invalid-${posted}`)
          }
          registration[posted] = req.body[posted]
        }
        for (const personField of openerOptional) {
          const posted = `relationship_account_opener_${personField}`
          if (req.body[posted]) {
            registration[posted] = req.body[posted]
          }
        }
        if (req.body.relationship_account_opener_verification_document_front) {
          registration.relationship_account_opener_verification_document_front = req.body.relationship_account_opener_verification_document_front
        }
        if (req.body.relationship_account_opener_verification_document_back) {
          registration.relationship_account_opener_verification_document_back = req.body.relationship_account_opener_verification_document_back
        }
        if (req.body.relationship_account_opener_title) {
          registration.relationship_account_opener_title = req.body.relationship_account_opener_title
        }
        if (req.body.relationship_account_opener_executive) {
          registration.relationship_account_opener_executive = true
        }
        if (req.body.relationship_account_opener_director) {
          registration.relationship_account_opener_director = true
        }
        continue
      }
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    const accountInfo = {
      metadata: {
      }
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
