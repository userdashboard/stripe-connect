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
            name: req.uploads.individual_verification_document_front.name,
            data: req.uploads.individual_verification_document_front.buffer
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
            name: req.uploads.individual_verification_additional_document_front.name,
            data: req.uploads.individual_verification_additional_document_front.buffer
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
    if (req.body.individual_address_state) {
      const states = connect.countryDivisions[stripeAccount.country]
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
        if (day < 10) {
          req.body.individual_dob_day = '0' + day
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
        if (month < 10) {
          req.body.individual_dob_month = '0' + month
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
        Date.parse(`${req.body.individual_dob_year}/${req.body.individual_dob_month}/${req.body.individual_dob_day}`)
      } catch (error) {
        throw new Error('invalid-individual_dob_day')
      }
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      for (const field of stripeAccount.requirements.currently_sue) {
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
          if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
            throw new Error('invalid-business_profile_url')
          }
          throw new Error(`invalid-${posted}`)
        }
        if (field === 'individual.gender' && req.body.individual_gender !== 'female' && req.body.individual_gender !== 'male') {
          throw new Error(`invalid-${posted}`)
        }
        if (field.startsWith('individual_address_')) {
          if (field.startsWith('individual_address_kana_')) {
            const property = field.substring('individual_address_kana_'.length)
            accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
            accountInfo.individual.address_kana[property] = req.body[field]
          } else if (field.startsWith('individual_address_kanji_')) {
            const property = field.substring('individual_address_kanji_'.length)
            accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
            accountInfo.individual.address_kanji[property] = req.body[field]
          } else {
            const property = field.substring('individual_address_'.length)
            accountInfo.individual.address[property] = req.body[field]
          }
        } else if (field.startsWith('individual_dob_')) {
          const property = field.substring('individual_dob_'.length)
          accountInfo.individual.dob[property] = req.body[field]
        } else if (field.startsWith('individual_verification_document_')) {
          accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
          const property = field.substring('individual_verification_document_'.length)
          accountInfo.individual.verification.document[property] = req.body[field]
        } else if (field.startsWith('individual_verification_additional_document_')) {
          accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
          const property = field.substring('individual_verification_additional_document_'.length)
          accountInfo.individual.verification.additional_document[property] = req.body[field]
        } else if (field.startsWith('individual_')) {
          const property = field.substring('individual_'.length)
          accountInfo.individual[property] = req.body[field]
        } else if (field.startsWith('business_profile_')) {
          const property = field.substring('business_profile_'.length)
          accountInfo.business_profile[property] = req.body[field]
        } else {
          accountInfo[field] = req.body[field]
        }
      }
    }
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
