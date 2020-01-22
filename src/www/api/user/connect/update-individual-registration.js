const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
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
    if (!stripeAccount.requirements.currently_due.length ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads) {
      if (req.uploads.verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_document_front.name,
            data: req.uploads.verification_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-verification_document_front')
        }
      }
      if (req.uploads.verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_document_back.name,
            data: req.uploads.verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-verification_document_back')
        }
      }
      if (req.uploads.verification_additional_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_additional_document_front.name,
            data: req.uploads.verification_additional_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_additional_document_front = file.id
        } catch (error) {
          throw new Error('invalid-verification_additional_document_front')
        }
      }
      if (req.uploads.verification_additional_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_additional_document_back.name,
            data: req.uploads.verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_additional_document_back = file.id
        } catch (error) {
          throw new Error('invalid-verification_additional_document_back')
        }
      }
    }
    if (req.body.address_state) {
      const states = connect.countryDivisions[stripeAccount.country]
      let found = false
      for (const state of states) {
        found = state.value === req.body.address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-address_state')
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
    if (req.body.dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-dob_day')
        }
      } catch (s) {
        throw new Error('invalid-dob_day')
      }
    }
    if (req.body.dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-dob_month')
        }
      } catch (s) {
        throw new Error('invalid-dob_month')
      }
    }
    if (req.body.dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-dob_year111')
        }
      } catch (s) {
        throw new Error('invalid-dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.dob_day) {
        throw new Error('invalid-dob_day')
      }
      if (!req.body.dob_month) {
        throw new Error('invalid-dob_month')
      }
      if (!req.body.dob_year) {
        throw new Error('invalid-dob_year')
      }
      try {
        Date.parse(`${req.body.dob_year}/${req.body.dob_month}/${req.body.dob_day}`)
      } catch (error) {
        throw new Error('invalid-dob_day')
      }
    }
    stripeAccount.individual = stripeAccount.individual || {}
    stripeAccount.individual.verification = stripeAccount.individual.verification || {}
    stripeAccount.individual.verification.document = stripeAccount.individual.verification.document || {}
    stripeAccount.individual.verification.additional_document = stripeAccount.individual.verification.additional_document || {}
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      accountInfo.individual = {}
      for (const field of stripeAccount.requirements.currently_due) {
        const posted = field.split('.').join('_').replace('individual_', '')
        if (!req.body[posted]) {
          if (field === 'individual.address.line2' ||
             (field === 'business_profile.url' && req.body.business_profile_product_description) ||
             (field === 'business_profile.product_description' && req.body.business_profile_url) ||
              field === 'external_account' ||
              field === 'individual.verification.document' ||
              field === 'individual.verification.additional_document' ||
              field === 'tos_acceptance.date' ||
              field === 'tos_acceptance.ip') {
            continue
          }
          if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
            throw new Error('invalid-business_profile_url')
          }
          throw new Error(`invalid-${posted}`)
        }
        if (field === 'individual.gender' && req.body.gender !== 'female' && req.body.gender !== 'male') {
          throw new Error(`invalid-${posted}`)
        }
        if (field.startsWith('individual.address_kana.')) {
          const property = field.substring('individual.address_kana.'.length)
          accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
          accountInfo.individual.address_kana[property] = req.body[posted]
        } else if (field.startsWith('individual.address_kanji.')) {
          const property = field.substring('individual.address_kanji.'.length)
          accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
          accountInfo.individual.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('individual.address.')) {
          const property = field.substring('individual.address.'.length)
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address[property] = req.body[posted]
        } else if (field.startsWith('individual.dob.')) {
          const property = field.substring('individual.dob.'.length)
          accountInfo.individual.dob = accountInfo.individual.dob || {}
          accountInfo.individual.dob[property] = req.body[posted]
        } else if (field.startsWith('business_profile.')) {
          const property = field.substring('business_profile.'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
        } else if (field.startsWith('individual.')) {
          const property = field.substring('individual.'.length)
          accountInfo.individual[property] = req.body[posted]
        }
      }
      for (const field of stripeAccount.requirements.eventually_due) {
        if (stripeAccount.requirements.currently_due.indexOf(field) > -1) {
          continue
        }
        const posted = field.split('.').join('_').replace('individual_', '')
        if (!req.body[posted]) {
          continue
        }
        if (field.startsWith('individual.address_kana.')) {
          const property = field.substring('individual.address_kana.'.length)
          accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
          accountInfo.individual.address_kana[property] = req.body[posted]
        } else if (field.startsWith('individual.address_kanji.')) {
          const property = field.substring('individual.address_kanji.'.length)
          accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
          accountInfo.individual.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('individual.address.')) {
          const property = field.substring('individual.address.'.length)
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address[property] = req.body[posted]
        } else if (field.startsWith('individual.dob.')) {
          const property = field.substring('individual.dob.'.length)
          accountInfo.individual.dob = accountInfo.individual.dob || {}
          accountInfo.individual.dob[property] = req.body[posted]
        } else if (field.startsWith('business_profile.')) {
          const property = field.substring('business_profile.'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
        } else if (field.startsWith('individual.')) {
          const property = field.substring('individual.'.length)
          accountInfo.individual[property] = req.body[posted]
        }
      }
      if (req.body.address_line2) {
        accountInfo.address = accountInfo.address || {}
        accountInfo.address.line2 = req.body.address_line2
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
        accountInfo.business_profile = accountInfo.business_profile || {}
        accountInfo.business_profile.mcc = req.body.business_profile_mcc
      }
      if (req.body.business_profile_url) {
        if (!req.body.business_profile_url.startsWith('http://') &&
            !req.body.business_profile_url.startsWith('https://')) {
          throw new Error('invalid-business_profile_url')
        }
        accountInfo.business_profile = accountInfo.business_profile || {}
        accountInfo.business_profile.url = req.body.business_profile_url
      }
      if (req.body.business_profile_product_description) {
        accountInfo.business_profile = accountInfo.business_profile || {}
        accountInfo.business_profile.product_description = req.body.business_profile_product_description
      }
      if (req.body.verification_document_back && !stripeAccount.individual.verification.document.back) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.verification = accountInfo.individual.verification || {}
        accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
        accountInfo.individual.verification.document.back = req.body.verification_document_back
      }
      if (req.body.verification_document_front && !stripeAccount.individual.verification.document.front) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.verification = accountInfo.individual.verification || {}
        accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
        accountInfo.individual.verification.document.front = req.body.verification_document_front
      }
      if (req.body.verification_additional_document_back && !stripeAccount.individual.verification.additional_document.back) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.verification = accountInfo.individual.verification || {}
        accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
        accountInfo.individual.verification.additional_document.back = req.body.verification_additional_document_back
      }
      if (req.body.verification_additional_document_front && !stripeAccount.individual.verification.additional_document.front) {
        accountInfo.individual = accountInfo.individual || {}
        accountInfo.individual.verification = accountInfo.individual.verification || {}
        accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
        accountInfo.individual.verification.additional_document.front = req.body.verification_additional_document_front
      }
    }
    while (true) {
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        await stripeCache.update(accountNow)
        return accountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.raw && error.raw.code === 'resource_missing') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
       if (error.type === 'StripeAPIError') {
          continue
       }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
