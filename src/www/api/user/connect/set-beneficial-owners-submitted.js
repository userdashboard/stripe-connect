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
    let stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      (stripeAccount.company && stripeAccount.company.owners_provided) ||
      connect.kycRequirements[stripeAccount.country].beneficialOwner === undefined) {
      throw new Error('invalid-stripe-account')
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    const persons = []
    if (owners && owners.length) {
      for (const owner of owners) {
        const ownerInfo = {}
        if (global.stripeJS === 3) {
          ownerInfo.person_token = owner.token
        } else {
          for (const field in owner) {
            if (!field.startsWith('relationship_owner_')) {
              continue
            }
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
        try {
          const person = await stripe.accounts.createPerson(req.query.stripeid, ownerInfo, req.stripeKey)
          await stripeCache.update(person)
          persons.push({ personid: person.id })
        } catch (error) {
          throw new Error('unknown-error')
        }
      }
    }
    const accountInfo = {
      company: {
        owners_provided: true
      },
      metadata: {}
    }
    connect.MetaData.store(stripeAccount.metadata, 'owners', persons)
    for (const field in stripeAccount.metadata) {
      if (field.startsWith('owners')) {
        accountInfo.metadata[field] = stripeAccount.metadata[field]
      }
    }
    while (true) {
      try {
        stripeAccount = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        req.success = true
        await stripeCache.update(stripeAccount)
        return stripeAccount
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        throw new Error('unknown-error')
      }
    }
  }
}
