const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      (stripeAccount.company && stripeAccount.company.owners_provided) ||
      connect.kycRequirements[stripeAccount.country].beneficialOwner === undefined) {
      throw new Error('invalid-stripe-account')
    }
    if (global.stripeJS !== 3) {
      const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
      if (owners && owners.length) {
        for (const owner of owners) {
          const ownerInfo = {
            first_name: owner.relationship_owner_first_name,
            last_name: owner.relationship_owner_last_name,
            address: {
              country: owner.relationship_owner_address_country,
              city: owner.relationship_owner_address_city,
              line1: owner.relationship_owner_address_line1,
              postal_code: owner.relationship_owner_address_postal_code
            },
            dob: {
              day: owner.relationship_owner_dob_day,
              month: owner.relationship_owner_dob_month,
              year: owner.relationship_owner_dob_year
            },
            relationship: {
              owner: true
            },
            verification: {
              document: {
                front: owner.relationship_owner_verification_document_front,
                back: owner.relationship_owner_verification_document_back
              }
            }
          }
          if (owner.relationship_owner_title) {
            ownerInfo.relationship.title = owner.relationship_owner_title
          }
          if (owner.relationship_owner_executive) {
            ownerInfo.relationship.executive = true
          }
          if (owner.relationship_owner_director) {
            ownerInfo.relationship.director = true
          }
          try {
            await stripe.accounts.createPerson(req.query.stripeid, ownerInfo, req.stripeKey)
          } catch (error) {
            const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
            throw new Error(errorMessage)
          }
        }
      }
    }
    const accountInfo = {
      company: {
        owners_provided: true
      }
    }
    try {
      stripeAccount = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(stripeAccount)
      return stripeAccount
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
