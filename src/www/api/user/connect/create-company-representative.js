const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (global.stripeJS === 3 && (!req.body || !req.body.token)) {
      throw new Error('invalid-token')
    }
    req.query.personid = stripeAccount.metadata.representative
    const existingRepresentative = await global.api.user.connect.CompanyRepresentative.get(req)
    const requirements = JSON.parse(stripeAccount.metadata.companyRepresentativeTemplate)
    for (const field of requirements.currently_due) {
      const posted = field.split('.').join('_')
      if (!req.body || !req.body[posted]) {
        if (field === 'address.line2' ||
            field === 'relationship.title' ||
            field === 'relationship.executive' ||
            field === 'relationship.representative' ||
            field === 'owner' ||
            field === 'verification.document.front' ||
            field === 'verification.document.back') {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
    }
    if (req.body.address_country && !connect.countryNameIndex[req.body.address_country]) {
      throw new Error('invalid-address_country')
    }
    if (requirements.currently_due.indexOf('address.country') > -1 ||
        requirements.eventually_due.indexOf('address.country') > -1) {
      if (!req.body.address_country) {
        throw new Error('invalid-address_country')
      }
      if (requirements.currently_due.indexOf('address.state') > -1 ||
          requirements.eventually_due.indexOf('address.state') > -1) {
        if (!req.body.address_state) {
          throw new Error('invalid-address_state')
        }
        const states = connect.countryDivisions[req.body.address_country]
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
      }
    }
    if (req.body.relationship_percent_ownership) {
      try {
        const ownership = parseFloat(req.body.relationship_percent_ownership, 10)
        if (ownership < 0 || ownership > 100 || ownership.toString() !== req.body.relationship_percent_ownership) {
          throw new Error('invalid-relationship_percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-relationship_percent_ownership')
      }
    }
    let validateDOB
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
          throw new Error('invalid-dob_year')
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
    if (req.uploads && req.uploads.verification_document_front) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.verification_document_front.name,
          data: req.uploads.verification_document_front.buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-verification_document_front')
      }
    } else if (requirements.currently_due.indexOf('verification.document') > -1) {
      throw new Error('invalid-verification_document_front')
    }
    if (req.uploads && req.uploads.verification_document_back) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.verification_document_back.name,
          data: req.uploads.verification_document_back.buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-verification_document_back')
      }
    } else if (requirements.currently_due.indexOf('verification.document') > -1) {
      throw new Error('invalid-verification_document_back')
    }
    const representativeInfo = {
      relationship: {
        representative: true
      }
    }
    if (global.stripeJS === 3) {
      representativeInfo.person_token = req.body.token
    } else {
      for (const field of requirements.currently_due) {
        const posted = field.split('.').join('_').replace('representative.')
        if (req.body[posted]) {
          if (field.startsWith('address.')) {
            const property = field.substring('address.'.length)
            representativeInfo.address = representativeInfo.address || {}
            representativeInfo.address[property] = req.body[posted]
            continue
          } else if (field.startsWith('address_kana.')) {
            const property = field.substring('address_kana.'.length)
            representativeInfo.address_kana = representativeInfo.address_kana || {}
            representativeInfo.address_kana[property] = req.body[posted]
            continue
          } else if (field.startsWith('address_kanji.')) {
            const property = field.substring('address_kanji.'.length)
            representativeInfo.address_kanji = representativeInfo.address_kanji || {}
            representativeInfo.address_kanji[property] = req.body[posted]
            continue
          } else if (field.startsWith('verification.document.')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('verification.document.'.length)
            representativeInfo.verification = representativeInfo.verification || {}
            representativeInfo.verification.document = representativeInfo.verification.document || {}
            representativeInfo.verification.document[property] = req.body[posted]
          } else if (field.startsWith('verification.additional_document.')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('verification.additional_document.'.length)
            representativeInfo.verification = representativeInfo.verification || {}
            representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
            representativeInfo.verification.additional_document[property] = req.body[posted]
          } else if (field.startsWith('dob.')) {
            const property = field.substring('dob.'.length)
            representativeInfo.dob = representativeInfo.dob || {}
            representativeInfo.dob[property] = req.body[posted]
          } else if (field.startsWith('relationship.')) {
            const property = field.substring('relationship.'.length)
            representativeInfo.relationship = representativeInfo.relationship || {}
            representativeInfo.relationship[property] = req.body[posted]
            continue
          } else {
            const property = field
            representativeInfo[property] = req.body[posted]
          }
        }
      }
      for (const field of requirements.eventually_due) {
        if (requirements.currently_due.indexOf(field) > -1) {
          continue
        }
        const posted = field.split('.').join('_').replace('representative.')
        if (req.body[posted]) {
          if (field.startsWith('address.')) {
            const property = field.substring('address.'.length)
            representativeInfo.address = representativeInfo.address || {}
            representativeInfo.address[property] = req.body[posted]
            continue
          } else if (field.startsWith('address_kana.')) {
            const property = field.substring('address_kana.'.length)
            representativeInfo.address_kana = representativeInfo.address_kana || {}
            representativeInfo.address_kana[property] = req.body[posted]
            continue
          } else if (field.startsWith('address_kanji.')) {
            const property = field.substring('address_kanji.'.length)
            representativeInfo.address_kanji = representativeInfo.address_kanji || {}
            representativeInfo.address_kanji[property] = req.body[posted]
            continue
          } else if (field.startsWith('verification.document.')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('verification.document.'.length)
            representativeInfo.verification = representativeInfo.verification || {}
            representativeInfo.verification.document = representativeInfo.verification.document || {}
            representativeInfo.verification.document[property] = req.body[posted]
          } else if (field.startsWith('verification.additional_document.')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('verification.additional_document.'.length)
            representativeInfo.verification = representativeInfo.verification || {}
            representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
            representativeInfo.verification.additional_document[property] = req.body[posted]
          } else if (field.startsWith('dob.')) {
            const property = field.substring('dob.'.length)
            representativeInfo.dob = representativeInfo.dob || {}
            representativeInfo.dob[property] = req.body[posted]
          } else if (field.startsWith('relationship.')) {
            const property = field.substring('relationship.'.length)
            representativeInfo.relationship = representativeInfo.relationship || {}
            representativeInfo.relationship[property] = req.body[posted]
            continue
          } else {
            const property = field
            representativeInfo[property] = req.body[posted]
          }
        }
      }
      if (req.body.relationship_title) {
        representativeInfo.relationship = representativeInfo.relationship || {}
        representativeInfo.relationship.title = req.body.relationship_title
      }
      if (req.body.relationship_percent_ownership) {
        representativeInfo.relationship = representativeInfo.relationship || {}
        representativeInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
      }
      if (req.body.relationship_executive) {
        representativeInfo.relationship = representativeInfo.relationship || {}
        representativeInfo.relationship.executive = true
      }
      if (req.body.relationship_director) {
        representativeInfo.relationship = representativeInfo.relationship || {}
        representativeInfo.relationship.director = true
      }
      if (req.body.relationship_owner) {
        representativeInfo.relationship = representativeInfo.relationship || {}
        representativeInfo.relationship.owner = true
      }
      if (req.body.address_line1) {
        representativeInfo.address = representativeInfo.address || {}
        representativeInfo.address.line1 = req.body.address_line1
      }
      if (req.body.address_line2) {
        representativeInfo.address = representativeInfo.address || {}
        representativeInfo.address.line2 = req.body.address_line2
      }
      if (req.body.address_state) {
        representativeInfo.address = representativeInfo.address || {}
        representativeInfo.address.state = req.body.address_state
      }
      if (req.body.address_postal_code) {
        representativeInfo.address = representativeInfo.address || {}
        representativeInfo.address.postal_code = req.body.address_postal_code
      }
      if (req.body.address_country) {
        representativeInfo.address = representativeInfo.address || {}
        representativeInfo.address.country = req.body.address_country
      }
      if (req.body.verification_document_back) {
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.document = representativeInfo.verification.document || {}
        representativeInfo.verification.document.back = req.body.verification_document_back
      }
      if (req.body.verification_document_front) {
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.document = representativeInfo.verification.document || {}
        representativeInfo.verification.document.front = req.body.verification_document_front
      }
      if (req.body.verification_additional_document_back) {
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
        representativeInfo.verification.additional_document.back = req.body.verification_additional_document_back
      }
      if (req.body.verification_additional_document_front) {
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
        representativeInfo.verification.additional_document.front = req.body.verification_additional_document_front
      }
    }
    if (existingRepresentative && existingRepresentative.metadata.template) {
      representativeInfo.metadata = {
        template: null
      }
    }
    let representative
    while (true) {
      try {
        if (existingRepresentative && existingRepresentative.metadata.template) {
          representative = await stripe.accounts.updatePerson(req.query.stripeid, existingRepresentative.id, representativeInfo, req.stripeKey)
        } else {
          representative = await stripe.accounts.createPerson(req.query.stripeid, representativeInfo, req.stripeKey)
          await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${representative.id}`, req.query.stripeid)
        }
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    const accountInfo = {
      metadata: {
        representative: representative.id
      }
    }
    while (true) {
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        await stripeCache.update(accountNow)
        return representative
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
