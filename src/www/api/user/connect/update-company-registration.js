const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
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
    if (!stripeAccount.requirements.currently_due.length ||
        stripeAccount.business_type === 'individual') {
      throw new Error('invalid-stripe-account')
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      if (req.uploads) {
        if (req.uploads.verification_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_document_back.name,
              data: req.uploads.verification_document_back.buffer
            }
          }
          while (true) {
            try {
              const front = await stripe.files.create(frontData, req.stripeKey)
              req.body.verification_document_front = front.id
              break
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
              if (error.message === 'An error occurred with our connection to Stripe.') {
                continue
              }
              if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('invalid-verification_document_front')
            }
          }
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
          while (true) {
            try {
              const back = await stripe.files.create(backData, req.stripeKey)
              req.body.verification_document_back = back.id
              break
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
              if (error.message === 'An error occurred with our connection to Stripe.') {
                continue
              }
              if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('invalid-verification_document_back')
            }
          }
        }
      }
      for (const field of stripeAccount.requirements.currently_due) {
        const posted = field.split('.').join('_').replace('company_', '')
        if (!req.body[posted]) {
          if (field === 'company.address.line2' ||
              field === 'company.verification.document' ||
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
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = req.body[posted]
        } else if (posted.startsWith('address_kana_')) {
          const property = posted.substring('address_kana_'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = req.body[posted]
        } else if (posted.startsWith('address_')) {
          const property = posted.substring('address_'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address[property] = req.body[posted]
        } else {
          const property = field.substring('company.'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company[property] = req.body[posted]
        }
      }
      for (const field of stripeAccount.requirements.eventually_due) {
        const posted = field.split('.').join('_').replace('company_', '')
        if (!req.body[posted]) {
          continue
        }
        if (posted.startsWith('business_profile_')) {
          const property = posted.substring('business_profile_'.length)
          accountInfo.business_profile = accountInfo.business_profile || {}
          accountInfo.business_profile[property] = req.body[posted]
        } else if (posted.startsWith('address_kanji_')) {
          const property = posted.substring('address_kanji_'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = req.body[posted]
        } else if (posted.startsWith('address_kana_')) {
          const property = posted.substring('address_kana_'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = req.body[posted]
        } else if (posted.startsWith('address_')) {
          const property = posted.substring('address_'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company.address = accountInfo.company.address || {}
          accountInfo.company.address[property] = req.body[posted]
        } else {
          const property = field.substring('company.'.length)
          accountInfo.company = accountInfo.company || {}
          accountInfo.company[property] = req.body[posted]
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
        accountInfo.business_profile.mcc = req.body.mcc
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
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.country = req.body.address_country
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
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.state = req.body.address_state
      }
      if (req.body.address_postal_code) {
        accountInfo.company.address = accountInfo.company.address || {}
        accountInfo.company.address.postal_code = req.body.address_postal_code
      }
      if (req.body.tax_id && !req.body.tax_id.length) {
        throw new Error('invalid-tax_id')
      }
      // TODO: check this document is required before updating
      // currently Stripe do not correctly report it as required
      // during testing it just goes straight to review without
      // submitting or ever requiring it
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
    }
    while (true) {
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        await stripeCache.delete(req.query.stripeid)
        return accountNow
      } catch (error) {
        if (error.raw && error.raw.param === 'account_token') {
          throw new Error('invalid-token')
        }
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
        if (error.message === 'An error occurred with our connection to Stripe.') {
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
