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
      stripeAccount.metadata.representative ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration) {
      throw new Error('invalid-registration')
    }
    const representativeInfo = {
      relationship: {
        representative: true
      },
      address: {}
    }
    if (registration.relationship_representative_relationship_title) {
      representativeInfo.relationship.title = registration.relationship_representative_relationship_title
    }
    if (registration.relationship_representative_executive) {
      representativeInfo.relationship.executive = true
    }
    if (registration.relationship_representative_director) {
      representativeInfo.relationship.director = true
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
        representativeInfo.address[property] = registration[field]
      } else if (field.startsWith('relationship_representative_verification_document_')) {
        if (global.stripeJS) {
          continue
        }
        const property = field.substring('relationship_representative_verification_document_'.length)
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.document = representativeInfo.verification.document || {}
        representativeInfo.verification.document[property] = registration[field]
      } else if (field.startsWith('relationship_representative_verification_additional_document_')) {
        if (global.stripeJS) {
          continue
        }
        const property = field.substring('relationship_representative_verification_additional_document_'.length)
        representativeInfo.verification = representativeInfo.verification || {}
        representativeInfo.verification.additional_document = representativeInfo.verification.additional_document || {}
        representativeInfo.verification.additional_document[property] = registration[field]
      } else if (field.startsWith('relationship_representative_dob_')) {
        const property = field.substring('relationship_representative_dob_'.length)
        representativeInfo.dob = representativeInfo.dob || {}
        representativeInfo.dob[property] = registration[field]
      } else {
        if (field === 'relationship_representative_relationship_title') {
          representativeInfo.relationship.title = registration[field]
          continue
        }
        const property = field.substring('relationship_representative_'.length)
        if (property === 'relationship_title' || property === 'executive' || property === 'director') {
          continue
        }
        representativeInfo[property] = registration[field]
      }
    }
    try {
      const representative = await stripe.accounts.createPerson(req.query.stripeid, representativeInfo, req.stripeKey)
      req.success = true
      const stripeAccountNow = await stripe.accounts.update(req.query.stripeid, {
        metadata: {
          representative: representative.id
        }
      }, req.stripeKey)
      await stripeCache.update(stripeAccountNow)
      req.success = true
      return stripeAccountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
