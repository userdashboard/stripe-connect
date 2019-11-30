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
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads) {
      if (req.uploads.individual_verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.individual_verification_document_back.name,
            data: req.uploads.individual_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.individual_verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-individual_verification_document_front')
        }
      }
      if (req.uploads.individual_verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.individual_verification_document_back.name,
            data: req.uploads.individual_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.individual_verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-individual_verification_document_back')
        }
      }
      if (req.uploads.individual_verification_additional_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.individual_verification_additional_document_back.name,
            data: req.uploads.individual_verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.individual_verification_additional_document_front = file.id
        } catch (error) {
          throw new Error('invalid-individual_verification_additional_document_front')
        }
      }
      if (req.uploads.individual_verification_additional_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.individual_verification_additional_document_back.name,
            data: req.uploads.individual_verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.individual_verification_additional_document_back = file.id
        } catch (error) {
          throw new Error('invalid-individual_verification_additional_document_back')
        }
      }
    }
    if (req.body.individual_address_country) {
      if (!connect.countryNameIndex[req.body.individual_address_country]) {
        throw new Error('invalid-individual_address_country')
      }
    }
    if (req.body.individual_address_state) {
      const states = connect.countryDivisions[req.body.individual_address_country]
      let found = false
      for (const state of states) {
        found = state.value === req.body.individual_address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-individual_address_state')
      }
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
    let validateDOB = false
    if (req.body.individual_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.individual_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-individual_dob_day')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_day')
      }
    }
    if (req.body.individual_dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.individual_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-individual_dob_month')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_month')
      }
    }
    if (req.body.individual_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.individual_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-individual_dob_year111')
        }
      } catch (s) {
        throw new Error('invalid-individual_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.individual_dob_day) {
        throw new Error('invalid-individual_dob_day')
      }
      if (!req.body.individual_dob_month) {
        throw new Error('invalid-individual_dob_month')
      }
      if (!req.body.individual_dob_year) {
        throw new Error('invalid-individual_dob_year')
      }
      try {
        new Date(req.body.individual_dob_year, req.body.individual_dob_month, req.body.individual_dob_day)
      } catch (error) {
        throw new Error('invalid-individual_dob_day')
      }
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].individual
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'individual.address.line2' ||
            field === 'individual.verification.document.front' ||
            field === 'individual.verification.document.back' ||
            field === 'individual.verification.additional_document.front' ||
            field === 'individual.verification.additional_document.back' ||
           (field === 'business_profile.url' && req.body.business_profile_product_description) ||
           (field === 'business_profile.product_description' && req.body.business_profile_url)) {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      if (field === 'individual.gender' && req.body.individual_gender !== 'female' && req.body.individual_gender !== 'male') {
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    if (global.stripeJS === 3 && req.body.token) {
      registration.individual_token = req.body.token
    }
    if (req.body.individual_verification_document_front) {
      registration.individual_verification_document_front = req.body.individual_verification_document_front
    }
    if (req.body.individual_verification_document_back) {
      registration.individual_verification_document_back = req.body.individual_verification_document_back
    }
    if (req.body.individual_verification_additional_document_front) {
      registration.individual_verification_additional_document_front = req.body.individual_verification_additional_document_front
    }
    if (req.body.individual_verification_additional_document_back) {
      registration.individual_verification_additional_document_back = req.body.individual_verification_additional_document_back
    }
    const accountInfo = {
      metadata: {}
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
