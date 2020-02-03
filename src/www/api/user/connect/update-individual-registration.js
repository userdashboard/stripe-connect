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
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.requirements.currently_due.length ||
      stripeAccount.business_type !== 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    req.body = req.body || {}
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const accountInfo = {}
    if (global.stripeJS === 3) {
      accountInfo.account_token = req.body.token
    } else {
      accountInfo.individual = {}
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
        if (req.uploads.verification_additional_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_front.name,
              data: req.uploads.verification_additional_document_front.buffer
            }
          }
          while (true) {
            try {
              const front = await stripe.files.create(frontData, req.stripeKey)
              req.body.verification_additional_document_front = front.id
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
        if (req.uploads.verification_additional_document_back) {
          const backData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_back.name,
              data: req.uploads.verification_additional_document_back.buffer
            }
          }
          while (true) {
            try {
              const back = await stripe.files.create(backData, req.stripeKey)
              req.body.verification_additional_document_back = back.id
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
      accountInfo.business_profile = accountInfo.business_profile || {}
      accountInfo.business_profile.business_profile_mcc = req.body.business_profile_mcc
    }
    if (req.body.business_profile_url) {
      if (!req.body.business_profile_url.startsWith('http://') &&
          !req.body.business_profile_url.startsWith('https://')) {
        throw new Error('invalid-business_profile_url')
      }
      accountInfo.business_profile = accountInfo.business_profile || {}
      accountInfo.business_profile.business_profile_url = req.body.business_profile_url
    }
    if (req.body.business_profile_product_description) {
      accountInfo.business_profile = accountInfo.business_profile || {}
      accountInfo.business_profile.business_profile_product_description = req.body.business_profile_product_description
    }
    // TODO: these fields are optional but not represented in requirements
    // so when Stripe updates to have something like an 'optionally_due' array
    // the manual checks can be removed
    if (req.body.relationship_title) {
      accountInfo.relationship = accountInfo.relationship || {}
      accountInfo.relationship.title = req.body.relationship_title
    }
    if (req.body.relationship_executive) {
      accountInfo.relationship = accountInfo.relationship || {}
      accountInfo.relationship.executive = true
    }
    if (req.body.relationship_director) {
      accountInfo.relationship = accountInfo.relationship || {}
      accountInfo.relationship.director = true
    }
    if (req.body.relationship_owner) {
      accountInfo.relationship = accountInfo.relationship || {}
      accountInfo.relationship.owner = true
    }
    if (req.body.relationship_percent_ownership) {
      try {
        const percent = parseFloat(req.body.relationship_percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-relationship_percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-relationship_percent_ownership')
      }
      accountInfo.relationship = accountInfo.relationship || {}
      accountInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
    }
    if (req.body.address_line2) {
      accountInfo.address = accountInfo.address || {}
      accountInfo.address.line2 = req.body.address_line2
    }
    if (req.body.address_country && req.body.address_country.length) {
      if (!connect.countryNameIndex[req.body.address_country]) {
        throw new Error('invalid-address_country')
      }
      accountInfo.address = accountInfo.address || {}
      accountInfo.address.country = req.body.address_country
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
      accountInfo.address = accountInfo.address || {}
      accountInfo.address.state = req.body.address_state
    }
    if (req.body.address_postal_code) {
      accountInfo.address = accountInfo.address || {}
      accountInfo.address.postal_code = req.body.address_postal_code
    }
    if (req.body.gender && req.body.gender !== 'male' && req.body.gender !== 'female') {
      throw new Error('invalid-gender')
    }
    if (req.body.id_number) {
      try {
        const idNumber = parseInt(req.body.id_number, 10)
        if (!idNumber || idNumber.toString() !== req.body.id_number) {
          throw new Error('invalid-id_number')
        }
      } catch (s) {
        throw new Error('invalid-id_number')
      }
    }
    if (req.body.ssn_last_4) {
      try {
        const ssnLast4 = parseInt(req.body.ssn_last_4, 10)
        if (!ssnLast4 || ssnLast4.toString() !== req.body.ssn_last_4) {
          throw new Error('invalid-ssn_last_4')
        }
      } catch (s) {
        throw new Error('invalid-ssn_last_4')
      }
    }
    if (req.body.verification_document_back) {
      accountInfo.verification = accountInfo.verification || {}
      accountInfo.verification.document = accountInfo.verification.document || {}
      accountInfo.verification.document.back = req.body.verification_document_back
    }
    if (req.body.verification_document_front) {
      accountInfo.verification = accountInfo.verification || {}
      accountInfo.verification.document = accountInfo.verification.document || {}
      accountInfo.verification.document.front = req.body.verification_document_front
    }
    if (req.body.verification_additional_document_back) {
      accountInfo.verification = accountInfo.verification || {}
      accountInfo.verification.additional_document = accountInfo.verification.additional_document || {}
      accountInfo.verification.additional_document.back = req.body.verification_additional_document_back
    }
    if (req.body.verification_additional_document_front) {
      accountInfo.verification = accountInfo.verification || {}
      accountInfo.verification.additional_document = accountInfo.verification.additional_document || {}
      accountInfo.verification.additional_document.front = req.body.verification_additional_document_front
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
