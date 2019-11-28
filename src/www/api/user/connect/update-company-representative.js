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
    let validateDOB = false
    if (req.body.relationship_representative_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.relationship_representative_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-relationship_representative_dob_day')
        }
      } catch (s) {
        throw new Error('invalid-relationship_representative_dob_day')
      }
    }
    if (req.body.relationship_representative_dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.relationship_representative_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-relationship_representative_dob_month')
        }
      } catch (s) {
        throw new Error('invalid-relationship_representative_dob_month')
      }
    }
    if (req.body.relationship_representative_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.relationship_representative_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-relationship_representative_dob_year')
        }
      } catch (s) {
        throw new Error('invalid-relationship_representative_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.relationship_representative_dob_day) {
        throw new Error('invalid-relationship_representative_dob_day')
      }
      if (!req.body.relationship_representative_dob_month) {
        throw new Error('invalid-relationship_representative_dob_month')
      }
      if (!req.body.relationship_representative_dob_year) {
        throw new Error('invalid-relationship_representative_dob_year')
      }
      try {
        new Date(req.body.relationship_representative_dob_year, req.body.relationship_representative_dob_month, req.body.relationship_representative_dob_day)
      } catch (error) {
        throw new Error('invalid-relationship_representative_dob_day')
      }
    }
    if (req.uploads) {
      if (req.uploads.relationship_representative_verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.relationship_representative_verification_document_front.name,
            data: req.uploads.relationship_representative_verification_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.relationship_representative_verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-relationship_representative_verification_document_front')
        }
      }
      if (req.uploads.relationship_representative_verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.relationship_representative_verification_document_back.name,
            data: req.uploads.relationship_representative_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.relationship_representative_verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-relationship_representative_verification_document_back')
        }
      }
      if (req.uploads.relationship_representative_verification_additional_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.relationship_representative_verification_additional_document_front.name,
            data: req.uploads.relationship_representative_verification_additional_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.relationship_representative_verification_additional_document_front = file.id
        } catch (error) {
          throw new Error('invalid-relationship_representative_verification_additional_document_front')
        }
      }
      if (req.uploads.relationship_representative_verification_additional_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.relationship_representative_verification_additional_document_back.name,
            data: req.uploads.relationship_representative_verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.relationship_representative_verification_additional_document_back = file.id
        } catch (error) {
          throw new Error('invalid-relationship_representative_verification_additional_document_back')
        }
      }
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].companyRepresentative
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'relationship.representative.address.line2' ||
            field === 'relationship.representative.relationship.title' ||
            field === 'relationship.representative.executive' ||
            field === 'relationship.representative.director' ||
            field === 'relationship.representative.owner') {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    if (req.body.relationship_representative_title) {
      registration.relationship_representative_title = req.body.relationship_representative_title
    }
    if (req.body.relationship_representative_executive) {
      registration.relationship_representative_executive = true
    }
    if (req.body.relationship_representative_director) {
      registration.relationship_representative_director = true
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
