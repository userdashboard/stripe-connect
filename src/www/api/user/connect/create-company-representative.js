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
    if (!req.body) {
      throw new Error('invalid-first_name')
    }
    if (!req.body.address_country || !connect.countryNameIndex[req.body.address_country]) {
      throw new Error('invalid-address_country')
    }
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
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const requirements = JSON.parse(stripeAccount.metadata.beneficialOwnerTemplate)
    for (const field of requirements.currently_due) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'address.line2' ||
            field === 'relationship.title' ||
            field === 'executive' ||
            field === 'representative' ||
            field === 'verification.document.front' ||
            field === 'verification.document.back' ||
            field === 'representative') {
          continue
        }
        throw new Error(`invalid-${posted}`)
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
    } else if (!req.body.token) {
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
    } else if (!req.body.token) {
      throw new Error('invalid-verification_document_back')
    }
    const representativeInfo = {
      relationship: {
        representative: true
      }
    }
    if (global.stripeJS === 3) {
      representativeInfo.token = req.body.token
    } else {
      for (const field of requirements.currently_due) {
        const posted = field.split('.').join('_')
        if (req.body[posted]) {
          if (field.startsWith('address.')) {
            const property = field.substring('address.'.length)
            representativeInfo.address = representativeInfo.address || {}
            representativeInfo.address[property] = req.body[posted]
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
          } else if (field === 'relationship.') {
            const property = field.substring('relationship.'.length)
            representativeInfo.relationship = representativeInfo.relationship || {}
            representativeInfo.relationship[property] = req.body[posted]
            continue
          } else {
            const property = field
            if (property === 'relationship_title' || property === 'executive' || property === 'representative') {
              continue
            }
            representativeInfo[property] = req.body[posted]
          }
        }
      }
    }
    let representative
    while (true) {
      try {
        representative = await stripe.accounts.createPerson(req.query.stripeid, representativeInfo, req.stripeKey)
        await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${representative.id}`, req.query.stripeid)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
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
        req.success = true
        return representative
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error); } throw new Error('unknown-error')
      }
    }
  }
}
