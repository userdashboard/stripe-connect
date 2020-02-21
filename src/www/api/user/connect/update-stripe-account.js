const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    req.body = req.body || {}
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.requirements.currently_due.length) {
      throw new Error('invalid-stripe-account')
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
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
      accountInfo.metadata = {
        token: false
      }
      if (req.uploads) {
        if (req.uploads.verification_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_document_front.name,
              data: req.uploads.verification_document_front.buffer
            }
          }
          const front = await stripeCache.execute('files', 'create', frontData, req.stripeKey)
          req.body.verification_document_front = front.id
        }
        if (req.uploads.verification_document_back) {
          const backData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_document_back.name,
              data: req.uploads.verification_document_back.buffer
            }
          }
          const back = await stripeCache.execute('files', 'create', backData, req.stripeKey)
          req.body.verification_document_back = back.id
        }
        if (req.uploads.verification_additional_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_front.name,
              data: req.uploads.verification_additional_document_front.buffer
            }
          }
          const front = await stripeCache.execute('files', 'create', frontData, req.stripeKey)
          req.body.verification_additional_document_front = front.id
        }
        if (req.uploads.verification_additional_document_back) {
          const backData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_back.name,
              data: req.uploads.verification_additional_document_back.buffer
            }
          }
          const back = await stripeCache.execute('files', 'create', backData, req.stripeKey)
          req.body.verification_additional_document_back = back.id
        }
      }
      for (const field of stripeAccount.requirements.currently_due) {
        const posted = field.split('.').join('_').replace('company_', '').replace('individual_', '')
        if (!req.body[posted]) {
          if (field === 'company.address.line2' ||
              field === 'company.verification.document' ||
              field === 'individual.verification.document' ||
              field === 'individual.verification.additional_document' ||
              field === 'external_account' ||
              field.startsWith('relationship.') ||
              field.startsWith('tos_acceptance.') ||
              field.startsWith('person_') ||
            (field === 'business_profile.url' && req.body.business_profile_product_description) ||
            (field === 'business_profile.product_description' && req.body.business_profile_url)) {
            continue
          }
          if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
            throw new Error('invalid-business_profile_url')
          }
          throw new Error(`invalid-${posted}`)
        }
        if (posted.startsWith('business_profile_')) {
          const property = posted.substring('business_profile_'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
        } else if (posted.startsWith('address_kanji_')) {
          const property = posted.substring('address_kanji_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
            accountInfo.company.address_kanji[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
            accountInfo.individual.address_kanji[property] = req.body[posted]
          }
        } else if (posted.startsWith('address_kana_')) {
          const property = posted.substring('address_kana_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address_kana = accountInfo.company.address_kana || {}
            accountInfo.company.address_kana[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
            accountInfo.individual.address_kana[property] = req.body[posted]
          }
        } else if (posted.startsWith('address_')) {
          const property = posted.substring('address_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address = accountInfo.company.address || {}
            accountInfo.company.address[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address = accountInfo.individual.address || {}
            accountInfo.individual.address[property] = req.body[posted]
          }
        } else if (posted.startsWith('dob_')) {
          const property = posted.substring('dob_'.length)
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.dob = accountInfo.individual.dob || {}
          accountInfo.individual.dob[property] = req.body[posted]
        } else {
          if (stripeAccount.business_type === 'company') {
            const property = field.substring('company.'.length)
            accountInfo.company = accountInfo.company || {}
            accountInfo.company[property] = req.body[posted]
          } else {
            const property = field.substring('individual.'.length)
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual[property] = req.body[posted]
          }
        }
      }
      for (const field of stripeAccount.requirements.eventually_due) {
        const posted = field.split('.').join('_').replace('company_', '').replace('individual_', '')
        if (!req.body[posted]) {
          continue
        }
        if (posted.startsWith('business_profile_')) {
          const property = posted.substring('business_profile_'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
        } else if (posted.startsWith('address_kanji_')) {
          const property = posted.substring('address_kanji_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
            accountInfo.company.address_kanji[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address_kanji = accountInfo.individual.address_kanji || {}
            accountInfo.individual.address_kanji[property] = req.body[posted]
          }
        } else if (posted.startsWith('address_kana_')) {
          const property = posted.substring('address_kana_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address_kana = accountInfo.company.address_kana || {}
            accountInfo.company.address_kana[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address_kana = accountInfo.individual.address_kana || {}
            accountInfo.individual.address_kana[property] = req.body[posted]
          }
        } else if (posted.startsWith('address_')) {
          const property = posted.substring('address_'.length)
          if (stripeAccount.business_type === 'company') {
            accountInfo.company = accountInfo.company || {}
            accountInfo.company.address = accountInfo.company.address || {}
            accountInfo.company.address[property] = req.body[posted]
          } else {
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual.address = accountInfo.individual.address || {}
            accountInfo.individual.address[property] = req.body[posted]
          }
        } else if (posted.startsWith('dob_')) {
          const property = posted.substring('dob_'.length)
          accountInfo.individual.dob = accountInfo.individual.dob || {}
          accountInfo.individual.dob[property] = req.body[posted]
        } else {
          if (stripeAccount.business_type === 'company') {
            const property = field.substring('company.'.length)
            accountInfo.company = accountInfo.company || {}
            accountInfo.company[property] = req.body[posted]
          } else {
            const property = field.substring('individual.'.length)
            accountInfo.individual = accountInfo.individual || {}
            accountInfo.individual[property] = req.body[posted]
          }
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
      // TODO: these fields are optional but not represented in requirements
      // so when Stripe updates to have something like an 'optionally_due' array
      // the manual checks can be removed
      if (req.body.address_line2) {
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.line2 = req.body.address_line2
      }
      if (req.body.address_country && req.body.address_country.length) {
        if (!connect.countryNameIndex[req.body.address_country]) {
          throw new Error('invalid-address_country')
        }
        if (stripeAccount.business_type === 'company') {
          accountInfo.company = accountInfo.company || []
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address.country = req.body.address_country
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address.country = req.body.address_country
        }
      }
      if (req.body.address_state && req.body.address_state.length) {
        const states = connect.countryDivisions[req.body.address_country || stripeAccount.country]
        let found
        for (const state of states) {
          found = state.value === req.body.address_state
          if (found) {
            break
          }
        }
        if (!found) {
          throw new Error('invalid-address_state')
        }
        if (stripeAccount.business_type === 'company') {
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address.state = req.body.address_state
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address.state = req.body.address_state
        }
      }
      if (req.body.address_postal_code) {
        if (stripeAccount.business_type === 'company') {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address.postal_code = req.body.address_postal_code
        } else {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.address = accountInfo.individual.address || {}
          accountInfo.individual.address.postal_code = req.body.address_postal_code
        }
      }
      if (req.body.tax_id && !req.body.tax_id.length) {
        throw new Error('invalid-tax_id')
      }
      // TODO: check this document is required before updating
      // currently Stripe do not correctly report it as required
      // during testing it just goes straight to review without
      // submitting or ever requiring it
      if (stripeAccount.business_type === 'company') {
        if (req.body.verification_document_back) {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.verification = accountInfo.company.verification || {}
          accountInfo.company.verification.document = accountInfo.company.verification.document || {}
          accountInfo.company.verification.document.back = req.body.verification_document_back
        }
        if (req.body.verification_document_front) {
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.verification = accountInfo.company.verification || {}
          accountInfo.company.verification.document = accountInfo.company.verification.document || {}
          accountInfo.company.verification.document.front = req.body.verification_document_front
        }
      } else {
        if (req.body.gender && req.body.gender !== 'male' && req.body.gender !== 'female') {
          throw new Error('invalid-gender')
        }
        // TODO: 7 was arbitrarily selected as a minimum
        // but there must be an actual minimum value, and it
        // should be possible to have per-country minimums
        if (req.body.id_number && (!req.body.id_number.length || req.body.id_number.length < 7)) {
          throw new Error('invalid-id_number')
        }
        if (req.body.ssn_last_4 && req.body.ssn_last_4.length !== 4) {
          throw new Error('invalid-ssn_last_4')
        }
        if (req.body.verification_document_back) {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.verification = accountInfo.individual.verification || {}
          accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
          accountInfo.individual.verification.document.back = req.body.verification_document_back
        }
        if (req.body.verification_document_front) {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.verification = accountInfo.individual.verification || {}
          accountInfo.individual.verification.document = accountInfo.individual.verification.document || {}
          accountInfo.individual.verification.document.front = req.body.verification_document_front
        }
        if (req.body.verification_additional_document_back) {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.verification = accountInfo.individual.verification || {}
          accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
          accountInfo.individual.verification.additional_document.back = req.body.verification_additional_document_back
        }
        if (req.body.verification_additional_document_front) {
          accountInfo.individual = accountInfo.individual || {}
          accountInfo.individual.verification = accountInfo.individual.verification || {}
          accountInfo.individual.verification.additional_document = accountInfo.individual.verification.additional_document || {}
          accountInfo.individual.verification.additional_document.front = req.body.verification_additional_document_front
        }
      }
    }
    try {
      const stripeAccountNow = await stripeCache.execute('accounts', 'update', req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.delete(req.query.stripeid)
      return stripeAccountNow
    } catch (error) {
      if (error.message && error.message.startsWith('invalid-company_')) {
        throw new Error(error.message.replace('company_', ''))
      }
      throw error
    }
  }
}
