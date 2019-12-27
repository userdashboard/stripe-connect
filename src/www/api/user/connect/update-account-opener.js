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
    if (stripeAccount.metadata.submitted || stripeAccount.business_type === 'individual') {
      throw new Error('invalid-stripe-account')
    }
    let validateDOB = false
    if (req.body.account_opener_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.account_opener_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-account_opener_dob_day')
        }
        if (day < 10) {
          req.body.account_opener_dob_day = '0' + day
        }
      } catch (s) {
        throw new Error('invalid-account_opener_dob_day')
      }
    }
    if (req.body.account_opener_dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.account_opener_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-account_opener_dob_month')
        }
        if (month < 10) {
          req.body.account_opener_dob_month = '0' + month
        }
      } catch (s) {
        throw new Error('invalid-account_opener_dob_month')
      }
    }
    if (req.body.account_opener_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.account_opener_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-account_opener_dob_year')
        }
      } catch (s) {
        throw new Error('invalid-account_opener_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.account_opener_dob_day) {
        throw new Error('invalid-account_opener_dob_day')
      }
      if (!req.body.account_opener_dob_month) {
        throw new Error('invalid-account_opener_dob_month')
      }
      if (!req.body.account_opener_dob_year) {
        throw new Error('invalid-account_opener_dob_year')
      }
      try {
        Date.parse(`${req.body.account_opener_dob_year}/${req.body.account_opener_dob_month}/${req.body.account_opener_dob_day}`)
      } catch (error) {
        throw new Error('invalid-account_opener_dob_day')
      }
    }
    if (req.body.account_opener_address_country) {
      if (!connect.countryNameIndex[req.body.account_opener_address_country]) {
        throw new Error('invalid-account_opener_address_country')
      }
    }
    if (req.body.account_opener_address_state) {
      if (!req.body.account_opener_address_country) {
        throw new Error('invalid-account_opener_address_country')
      }
      const states = connect.countryDivisions[req.body.account_opener_address_country]
      if (!states || !states.length) {
        throw new Error('invalid-account_opener_address_state')
      }
      let found = false
      for (const state of states) {
        found = state.value === req.body.account_opener_address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-account_opener_address_state')
      }
    }
    if (req.uploads) {
      if (req.uploads.account_opener_verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.account_opener_verification_document_front.name,
            data: req.uploads.account_opener_verification_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.account_opener_verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-account_opener_verification_document_front')
        }
      }
      if (req.uploads.account_opener_verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.account_opener_verification_document_back.name,
            data: req.uploads.account_opener_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.account_opener_verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-account_opener_verification_document_back')
        }
      }
      if (req.uploads.account_opener_verification_additional_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.account_opener_verification_additional_document_front.name,
            data: req.uploads.account_opener_verification_additional_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.account_opener_verification_additional_document_front = file.id
        } catch (error) {
          throw new Error('invalid-account_opener_verification_additional_document_front')
        }
      }
      if (req.uploads.account_opener_verification_additional_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.account_opener_verification_additional_document_back.name,
            data: req.uploads.account_opener_verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.account_opener_verification_additional_document_back = file.id
        } catch (error) {
          throw new Error('invalid-account_opener_verification_additional_document_back')
        }
      }
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].accountOpener
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'relationship.account_opener.address.line2' ||
            field === 'relationship.account_opener.relationship.title' ||
            field === 'relationship.account_opener.relationship.executive' ||
            field === 'relationship.account_opener.relationship.director' ||
            field === 'relationship.account_opener.relationship.owner' ||
            (field === 'relationship.account_opener.verification.document.front' && req.body.token) ||
            (field === 'relationship.account_opener.verification.document.back' && req.body.token)) {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      registration[posted] = req.body[posted]
    }
    if (req.body.account_opener_percent_ownership) {
      try {
        const percent = parseFloat(req.body.account_opener_percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-account_opener_percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-account_opener_percent_ownership')
      }
      registration.account_opener_percent_ownership = req.body.account_opener_percent_ownership
    } else if (requiredFields.indexOf('relationship.account_opener.percent_ownership') > -1) {
      throw new Error('invalid-account_opener_percent_ownership')
    }
    if (req.body.account_opener_relationship_title) {
      registration.account_opener_relationship_title = req.body.account_opener_relationship_title
    }
    if (req.body.account_opener_relationship_executive) {
      registration.account_opener_relationship_executive = true
    }
    if (req.body.account_opener_relationship_director) {
      registration.account_opener_relationship_director = true
    }
    const accountInfo = {
      metadata: {
      }
    }
    if (global.stripeJS === 3) {
      registration.account_openerToken = req.body.token
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
