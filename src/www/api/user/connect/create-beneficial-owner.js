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
    if (!req.body) {
      throw new Error('invalid-first_name')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    const personFields = ['first_name', 'last_name', 'dob_day', 'dob_month', 'dob_year', 'address_city', 'address_line1', 'address_postal_code']
    const personOptional = ['address_line2', 'address_state', 'address_country']
    for (const field of personFields) {
      const posted = `relationship_owner_${field}`
      if (!req.body[posted]) {
        throw new Error(`invalid-${posted}`)
      }
    }
    if (stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
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
    } else {
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
    } else {
      throw new Error('invalid-relationship_owner_verification_document_back')
    }
    let owners = await global.api.user.connect.BeneficialOwners.get(req)
    owners = owners || []
    const id = await dashboard.UUID.generateID()
    const owner = {
      ownerid: `owner_${id}`,
      object: 'owner',
      created: dashboard.Timestamp.now,
      stripeid: req.query.stripeid
    }
    for (const field of personFields) {
      const posted = `relationship_owner_${field}`
      owner[posted] = req.body[posted]
    }
    for (const field of personOptional) {
      const posted = `relationship_owner_${field}`
      if (req.body[posted]) {
        owner[posted] = req.body[posted]
      }
    }
    if (req.body.relationship_owner_title) {
      owner.relationship_owner_title = req.body.relationship_owner_title
    }
    if (req.body.relationship_owner_executive) {
      owner.relationship_owner_executive = true
    }
    if (req.body.relationship_owner_director) {
      owner.relationship_owner_director = true
    }
    if (req.body.relationship_owner_owner) {
      owner.relationship_owner_owner = true
    }
    if (req.body.relationship_owner_verification_document_front) {
      owner.relationship_owner_verification_document_front = req.body.relationship_owner_verification_document_front
    }
    if (req.body.relationship_owner_verification_document_back) {
      owner.relationship_owner_verification_document_back = req.body.relationship_owner_verification_document_back
    }
    owners.unshift(owner)
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', owners)
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      await dashboard.Storage.write(`${req.appid}/map/ownerid/stripeid/${owner.ownerid}`, req.query.stripeid)
      req.success = true
      return owner
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
