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
      throw new Error('invalid-relationship_owner_first_name')
    }
    if (!req.body.relationship_owner_address_country || !connect.countryNameIndex[req.body.relationship_owner_address_country]) {
      throw new Error('invalid-relationship_owner_address_country')
    }
    if (!req.body.relationship_owner_address_state) {
      throw new Error('invalid-relationship_owner_address_state')
    }
    const states = connect.countryDivisions[req.body.relationship_owner_address_country]
    let found
    for (const state of states) {
      found = state.value === req.body.relationship_owner_address_state
      if (found) {
        break
      }
    }
    if (!found) {
      throw new Error('invalid-relationship_owner_address_state')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const person = await stripe.accounts.createPerson(req.query.stripeid, personInfo, req.stripekey)
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'relationship.owner.address.line2' ||
            field === 'relationship.owner.relationship.title' ||
            field === 'relationship.owner.executive' ||
            field === 'relationship.owner.director' ||
            field === 'relationship.owner.verification.document.front' ||
            field === 'relationship.owner.verification.document.back' ||
            field === 'relationship.owner.owner') {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
    }
    let validateDOB
    if (req.body.relationship_owner_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.relationship_owner_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-relationship_owner_dob_day')
        }
        if (day < 10) {
          req.body.relationship_owner_dob_day = '0' + day
        }
      } catch (s) {
        throw new Error('invalid-relationship_owner_dob_day')
      }
    }
    if (req.body.relationship_owner_dob_month) {
      try {
        const month = parseInt(req.body.relationship_owner_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-relationship_owner_dob_month')
        }
        if (month < 10) {
          req.body.relationship_owner_dob_month = '0' + month
        }
      } catch (s) {
        throw new Error('invalid-relationship_owner_dob_month')
      }
    }
    if (req.body.relationship_owner_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.relationship_owner_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-relationship_owner_dob_year')
        }
      } catch (s) {
        throw new Error('invalid-relationship_owner_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.relationship_owner_dob_day) {
        throw new Error('invalid-relationship_owner_dob_day')
      }
      if (!req.body.relationship_owner_dob_month) {
        throw new Error('invalid-relationship_owner_dob_month')
      }
      if (!req.body.relationship_owner_dob_year) {
        throw new Error('invalid-relationship_owner_dob_year')
      }
      try {
        Date.parse(`${req.body.relationship_owner_dob_year}/${req.body.relationship_owner_dob_month}/${req.body.relationship_owner_dob_day}`)
      } catch (error) {
        throw new Error('invalid-relationship_owner_dob_day')
      }
    }
    if (req.uploads && req.uploads.relationship_owner_verification_document_front) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_owner_verification_document_front.name,
          data: req.uploads.relationship_owner_verification_document_front.buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.relationship_owner_verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-relationship_owner_verification_document_front')
      }
    } else if (!req.body.token) {
      throw new Error('invalid-relationship_owner_verification_document_front')
    }
    if (req.uploads && req.uploads.relationship_owner_verification_document_back) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_owner_verification_document_back.name,
          data: req.uploads.relationship_owner_verification_document_back.buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.relationship_owner_verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-relationship_owner_verification_document_back')
      }
    } else if (!req.body.token) {
      throw new Error('invalid-relationship_owner_verification_document_back')
    }
    const ownerInfo = {
      metadata: {},
      relationship: {
        owner: true
      }
    }
    if (global.stripeJS === 3) {
      ownerInfo.token = req.body.token
    } else {
      for (const field of requiredFields) {
        const posted = field.split('.').join('_')
        if (req.body[posted]) {
          if (field.startsWith('relationship_owner_address_')) {
            const property = field.substring('relationship_owner_address_'.length)
            ownerInfo.address = ownerInfo.address || {}
            ownerInfo.address[property] = owner[field]
            continue
          } else if (field.startsWith('relationship_owner_verification_document_')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('relationship_owner_verification_document_'.length)
            ownerInfo.verification = ownerInfo.verification || {}
            ownerInfo.verification.document = ownerInfo.verification.document || {}
            ownerInfo.verification.document[property] = owner[field]
          } else if (field.startsWith('relationship_owner_verification_additional_document_')) {
            if (global.stripeJS) {
              continue
            }
            const property = field.substring('relationship_owner_verification_additional_document_'.length)
            ownerInfo.verification = ownerInfo.verification || {}
            ownerInfo.verification.additional_document = ownerInfo.verification.additional_document || {}
            ownerInfo.verification.additional_document[property] = owner[field]
          } else if (field.startsWith('relationship_owner_dob_')) {
            const property = field.substring('relationship_owner_dob_'.length)
            ownerInfo.dob = ownerInfo.dob || {}
            ownerInfo.dob[property] = owner[field]
          } else if (field === 'relationship_owner_relationship_') {
            const property = field.substring('relationship_owner_relationship_'.length)
            ownerInfo.relationship = ownerInfo.relationship || {}
            ownerInfo.relationship[property] = owner[field]
            continue
          } else {
            const property = field.substring('relationship_owner_'.length)
            if (property === 'relationship_title' || property === 'executive' || property === 'director') {
              continue
            }
            ownerInfo[property] = owner[field]
          }
        }
      }
    }
    const owner = await stripe.accounts.createPerson(req.query.stripeid, ownerInfo, req.stripekey)
    let owners = await global.api.user.connect.BeneficialOwners.get(req)
    owners = owners || []
    owners.unshift(owner.id)
    const accountInfo = {
      metadata: {
        owners
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow)
      await dashboard.Storage.write(`${req.appid}/map/personid/stripeid/${owner.id}`, req.query.stripeid)
      req.success = true
      return owner
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
