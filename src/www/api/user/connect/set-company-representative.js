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
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.business_type !== 'company' ||
      (stripeAccount.metadata.representative) ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration) {
      throw new Error('invalid-registration')
    }
    const representativeInfo = {}
    if (global.stripeJS === 3) {
      representativeInfo.person_token = registration.representativeToken
      for (const field in registration) {
        if (!field.startsWith('relationship_representative_')) {
          continue
        }
        delete (registration[field])
      }
    } else {
      representativeInfo.relationship = {}
      representativeInfo.relationship.representative = true
      if (registration.relationship_representative_relationship_executive) {
        representativeInfo.relationship.executive = true
      }
      if (registration.relationship_representative_relationship_director) {
        representativeInfo.relationship.director = true
      }
      if (registration.relationship_representative_relationship_owner) {
        representativeInfo.relationship.owner = true
      }
      if (registration.relationship_representative_relationship_title) {
        representativeInfo.relationship.title = registration.relationship_representative_relationship_title
      }
      if (registration.relationship_representative_percent_ownership) {
        representativeInfo.relationship.percent_ownership = registration.relationship_representative_percent_ownership
      }
      for (const field in registration) {
        if (!field.startsWith('relationship_representative_')) {
          continue
        }
        if (field.startsWith('relationship_representative_address_kanji_')) {
          const property = field.substring('relationship_representative_address_kanji_'.length)
          representativeInfo.address_kanji = representativeInfo.address_kanji || {}
          representativeInfo.address_kanji[property] = registration[field]
        } else if (field.startsWith('relationship_representative_address_kana_')) {
          const property = field.substring('relationship_representative_address_kana_'.length)
          representativeInfo.address_kana = representativeInfo.address_kana || {}
          representativeInfo.address_kana[property] = registration[field]
        } else if (field.startsWith('relationship_representative_address_')) {
          const property = field.substring('relationship_representative_address_'.length)
          representativeInfo.address = representativeInfo.address || {}
          representativeInfo.address[property] = registration[field]
        } else if (field.startsWith('relationship_representative_verification_document_')) {
          const property = field.substring('relationship_representative_verification_document_'.length)
          representativeInfo.verification = representativeInfo.verification || {}
          representativeInfo.verification.document = representativeInfo.verification.document || {}
          representativeInfo.verification.document[property] = registration[field]
        } else if (field.startsWith('relationship_representative_verification_additional_document_')) {
          const property = field.substring('relationship_representative_verification_additional_document_'.length)
          representativeInfo.verification = representativeInfo.verification || {}
          representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
          representativeInfo.verification.additional_document[property] = registration[field]
        } else if (field.startsWith('relationship_representative_dob_')) {
          const property = field.substring('relationship_representative_dob_'.length)
          representativeInfo.dob = representativeInfo.dob || {}
          representativeInfo.dob[property] = registration[field]
        } else if (field === 'relationship_representative_relationship_title') {
          representativeInfo.relationship.title = registration[field]
        } else {
          const property = field.substring('relationship_representative_'.length)
          if (property !== 'relationship_title' &&
              property !== 'relationship_executive' &&
              property !== 'percent_ownership' &&
              property !== 'relationship_director') {
            representativeInfo[property] = registration[field]
          }
        }
        delete (registration[field])
      }
    }
    let representative
    try {
      representative = await stripe.accounts.createPerson(req.query.stripeid, representativeInfo, req.stripeKey)
      req.success = true
    } catch (error) {
      throw new Error('unknown-error')
    }
    const accountInfo = {
      metadata: {
        representative: representative.id
      }
    }
    connect.MetaData.store(stripeAccount.metadata, 'registration', registration)
    for (const field in stripeAccount.metadata) {
      if (field.startsWith('registration')) {
        accountInfo.metadata[field] = stripeAccount.metadata[field]
      }
    }
    while (true) {
      try {
        const stripeAccountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        await stripeCache.update(stripeAccountNow)
        return representative
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        throw new Error('unknown-error')
      }
    }
  }
}
