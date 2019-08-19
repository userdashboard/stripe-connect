const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    if (!req.body || !req.body.relationship_owner_address_city) {
      throw new Error('invalid-relationship_owner_address_city')
    }
    if (!req.body.relationship_owner_address_country) {
      throw new Error('invalid-relationship_owner_address_country')
    }
    if (!req.body.relationship_owner_address_line1) {
      throw new Error('invalid-relationship_owner_address_line1')
    }
    if (!req.body.relationship_owner_address_postal_code) {
      throw new Error('invalid-relationship_owner_address_postal_code')
    }
    if (!req.body.relationship_owner_dob_day) {
      throw new Error('invalid-relationship_owner_dob_day')
    }
    if (!req.body.relationship_owner_dob_month) {
      throw new Error('invalid-relationship_owner_dob_month')
    }
    if (!req.body.relationship_owner_dob_year) {
      throw new Error('invalid-relationship_owner_dob_year')
    }
    if (!req.body.relationship_owner_first_name) {
      throw new Error('invalid-relationship_owner_first_name')
    }
    if (!req.body.relationship_owner_last_name) {
      throw new Error('invalid-relationship_owner_last_name')
    }
    if (req.uploads && req.uploads['relationship_owner_verification_documentation_front']) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_owner_verification_documentation_front'].name,
          data: req.uploads['relationship_owner_verification_documentation_front'].buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.relationship_owner_verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-relationship_owner_verification_documentation_front')
      }
    }
    if (req.uploads && req.uploads['relationship_owner_verification_documentation_back']) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_owner_verification_documentation_back'].name,
          data: req.uploads['relationship_owner_verification_documentation_back'].buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.relationship_owner_verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-relationship_owner_verification_documentation_back')
      }
    }
    const owner = await global.api.user.connect.BeneficialOwner.get(req)
    req.query.stripeid = owner.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    for (const field in req.body) {
      owner[field] = req.body[field]
    }
    if (owners && owners.length) {
      for (const i in owners) {
        if (owners[i].ownerid === req.query.ownerid) {
          owners[i] = owner
          break
        }
      }
    } else {
      owners = [owner]
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', owners)
    try {
      const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      req.success = true
      return owner
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
