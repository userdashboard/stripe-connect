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
    if (!req.body) {
      throw new Error('invalid_company_name')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted || stripeAccount.business_type === 'individual') {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads) {
      if (req.uploads.company_verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.company_verification_document_back.name,
            data: req.uploads.company_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.company_verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-company_verification_document_front')
        }
      }
      if (req.uploads.company_verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.company_verification_document_back.name,
            data: req.uploads.company_verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.company_verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-company_verification_document_back')
        }
      }
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      for (const field of stripeAccount.requirements.currently_due) {
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          if (field === 'company.address.line2' ||
              field === 'individual.verification.document.front' ||
              field === 'individual.verification.document.back' ||
            (field === 'business_profile.url' && req.body.business_profile_product_description) ||
            (field === 'business_profile.product_description' && req.body.business_profile_url)) {
            continue
          }
          if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
            throw new Error('invalid-business_profile_url')
          }
          throw new Error(`invalid-${posted}`)
        }
        if (field.startsWith('business_profile_')) {
          const property = field.substring('business_profile_'.length)
          accountInfo.business_profile[property] = req.body[field]
          delete (req.body[field])
          continue
        }
        if (field.startsWith('company_')) {
          if (field.startsWith('company_address_kanji_')) {
            const property = field.substring('company_address_kanji_'.length)
            accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
            accountInfo.company.address_kanji[property] = req.body[field]
          } else if (field.startsWith('company_address_kana_')) {
            const property = field.substring('company_address_kana_'.length)
            accountInfo.company.address_kana = accountInfo.company.address_kana || {}
            accountInfo.company.address_kana[property] = req.body[field]
          } else if (field.startsWith('company_address_')) {
            const property = field.substring('company_address_'.length)
            accountInfo.company.address[property] = req.body[field]
          } else if (field.startsWith('company_name_')) {
            const property = field.substring('company_name_'.length)
            accountInfo.company[`name_${property}`] = req.body[field]
          } else if (field.startsWith('company_verification_document_')) {
            const property = field.substring('company_verification_document_'.length)
            accountInfo.company.verification = accountInfo.company.verification || {}
            accountInfo.company.verification.document = accountInfo.company.verification.document || {}
            accountInfo.company.verification.document[property] = req.body[field]
          } else {
            const property = field.substring('company_'.length)
            accountInfo.company[property] = req.body[field]
          }
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
    }
    if (req.body.business_profile_url) {
      if (!req.body.business_profile_url.startsWith('http://') &&
          !req.body.business_profile_url.startsWith('https://')) {
        throw new Error('invalid-business_profile_url')
      }
    }
    if (req.body.company_address_state) {
      const states = connect.countryDivisions[stripeAccount.country]
      if (!states || !states.length) {
        throw new Error('invalid-company_address_state')
      }
      let found = false
      for (const state of states) {
        found = state.value === req.body.company_address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-company_address_state')
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
