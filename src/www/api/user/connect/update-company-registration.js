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
      throw new Error('invalid_name')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted || stripeAccount.business_type === 'individual') {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads) {
      if (req.uploads.verification_document_front) {
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
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      for (const field of stripeAccount.requirements.currently_due) {
        const posted = field.split('.').join('_').replace('company.', '')
        if (!req.body[posted]) {
          if (field === 'company.address.line2' ||
              field === 'company.verification.document' ||
            (field === 'business_profile.url' && req.body.business_profile_product_description) ||
            (field === 'business_profile.product_description' && req.body.business_profile_url)) {
            continue
          }
          if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
            throw new Error('invalid-business_profile_url')
          }
          throw new Error(`invalid-${posted}`)
        }
        if (field.startsWith('business_profile.')) {
          const property = field.substring('business_profile.'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
          delete (req.body[posted])
          continue
        } else if (field.startsWith('address_kanji.')) {
          const property = field.substring('address_kanji.'.length)
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('address_kana.')) {
          const property = field.substring('address_kana.'.length)
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = req.body[posted]
        } else if (field.startsWith('address.')) {
          const property = field.substring('address.'.length)
          accountInfo.company.address[property] = req.body[posted]
        } else if (field === 'company.verification.document') {
          accountInfo.company.verification = accountInfo.company.verification || {}
          accountInfo.company.verification.document = accountInfo.company.verification.document || {}
          const front = `${posted}_front`
          const back = `${posted}_back`
          if (req.body[front]) {
            accountInfo.company.verification.document.front = req.body[front]
          }
          if (req.body[back]) {
            accountInfo.company.verification.document.back = req.body[back]
          }
        } else {
          accountInfo.company[field] = req.body[posted]
        }
      }
      for (const field of stripeAccount.requirements.eventually_due) {
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          continue
        }
        if (field.startsWith('address_kanji.')) {
          const property = field.substring('address_kanji.'.length)
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('address_kana.')) {
          const property = field.substring('address_kana.'.length)
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = req.body[posted]
        } else if (field.startsWith('address.')) {
          const property = field.substring('address.'.length)
          accountInfo.company.address[property] = req.body[posted]
        } else if (field ==='company.verification.document') {
          accountInfo.company.verification = accountInfo.company.verification || {}
          accountInfo.company.verification.document = accountInfo.company.verification.document || {}
          const front = `${posted}_front`
          const back = `${posted}_back`
          if (req.body[front]) {
            accountInfo.company.verification.document.front = req.body[front]
          }
          if (req.body[back]) {
            accountInfo.company.verification.document.back = req.body[back]
          }
        } else {
          accountInfo.company[field] = req.body[posted]
        }
      }
      if (req.body.address_line2) {
        accountInfo.address = ownerInfo.address || {}
        accountInfo.address.line2 = req.body.address_line2
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
    if (req.body.address_state) {
      const states = connect.countryDivisions[stripeAccount.country]
      if (!states || !states.length) {
        throw new Error('invalid-address_state')
      }
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
    while(true) {
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        req.success = true
        await stripeCache.update(accountNow)
        return accountNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
      }
    }
  }
}
