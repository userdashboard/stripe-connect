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
    const person = await stripeCache.retrievePerson(req.query.stripeid, stripeAccount.metadata.representative, req.stripeKey)
    const representative = connect.MetaData.parse(person.metadata, 'representative') || {}
    const representativeInfo = {}
    if (global.stripeJS === 3) {
      representativeInfo.person_token = registration.representativeToken
      for (const field in representative) {
        if (!field.startsWith('relationship_representative_')) {
          continue
        }
        delete (representative[field])
      }
    } else {
      representativeInfo.relationship = {}
      representativeInfo.relationship.representative = true
      if (representative.relationship_representative_relationship_executive) {
        representativeInfo.relationship.executive = true
      }
      if (representative.relationship_representative_relationship_director) {
        representativeInfo.relationship.director = true
      }
      if (representative.relationship_representative_relationship_owner) {
        representativeInfo.relationship.owner = true
      }
      if (representative.relationship_representative_relationship_title) {
        representativeInfo.relationship.title = representative.relationship_representative_relationship_title
      }
      if (representative.relationship_representative_percent_ownership) {
        representativeInfo.relationship.percent_ownership = representative.relationship_representative_percent_ownership
      }
      for (const field in representative) {
        if (!field.startsWith('relationship_representative_')) {
          continue
        }
        if (field.startsWith('relationship_representative_address_kanji_')) {
          const property = field.substring('relationship_representative_address_kanji_'.length)
          representativeInfo.address_kanji = representativeInfo.address_kanji || {}
          representativeInfo.address_kanji[property] = representative[field]
        } else if (field.startsWith('relationship_representative_address_kana_')) {
          const property = field.substring('relationship_representative_address_kana_'.length)
          representativeInfo.address_kana = representativeInfo.address_kana || {}
          representativeInfo.address_kana[property] = representative[field]
        } else if (field.startsWith('relationship_representative_address_')) {
          const property = field.substring('relationship_representative_address_'.length)
          representativeInfo.address = representativeInfo.address || {}
          representativeInfo.address[property] = representative[field]
        } else if (field.startsWith('relationship_representative_verification_document_')) {
          const property = field.substring('relationship_representative_verification_document_'.length)
          representativeInfo.verification = representativeInfo.verification || {}
          representativeInfo.verification.document = representativeInfo.verification.document || {}
          representativeInfo.verification.document[property] = representative[field]
        } else if (field.startsWith('relationship_representative_verification_additional_document_')) {
          const property = field.substring('relationship_representative_verification_additional_document_'.length)
          representativeInfo.verification = representativeInfo.verification || {}
          representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
          representativeInfo.verification.additional_document[property] = representative[field]
        } else if (field.startsWith('relationship_representative_dob_')) {
          const property = field.substring('relationship_representative_dob_'.length)
          representativeInfo.dob = representativeInfo.dob || {}
          representativeInfo.dob[property] = representative[field]
        } else if (field === 'relationship_representative_relationship_title') {
          representativeInfo.relationship.title = representative[field]
        } else {
          const property = field.substring('relationship_representative_'.length)
          if (property !== 'relationship_title' &&
              property !== 'relationship_executive' &&
              property !== 'percent_ownership' &&
              property !== 'relationship_director') {
            representativeInfo[property] = representative[field]
          }
        }
        delete (representativeInfo[field])
      }
    }
    connect.MetaData.store(person.metadata, 'representative', representative)
    for (const field in person.metadata) {
      if (field.startsWith('registration')) {
        representativeInfo.metadata[field] = representative.metadata[field]
      }
    }
    try {
      const personNow = await stripe.accounts.updatePerson(req.query.stripeid, representativeInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(personNow)
      return personNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
