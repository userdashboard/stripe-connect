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
      (stripeAccount.company && stripeAccount.company.directors_provided) ||
      connect.kycRequirements[stripeAccount.country].companyDirector === undefined) {
      throw new Error('invalid-stripe-account')
    }
    const persons = []
    const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
    if (directors && directors.length) {
      for (const director of directors) {
        const directorInfo = {}
        if (global.stripeJS === 3) {
          directorInfo.person_token = director.token
        } else {
          for (const field in director) {
            if (!field.startsWith('relationship_director_')) {
              continue
            }
            if (field.startsWith('relationship_director_address_')) {
              const property = field.substring('relationship_director_address_'.length)
              directorInfo.address = directorInfo.address || {}
              directorInfo.address[property] = director[field]
              continue
            } else if (field.startsWith('relationship_director_verification_document_')) {
              if (global.stripeJS) {
                continue
              }
              const property = field.substring('relationship_director_verification_document_'.length)
              directorInfo.verification = directorInfo.verification || {}
              directorInfo.verification.document = directorInfo.verification.document || {}
              directorInfo.verification.document[property] = director[field]
            } else if (field.startsWith('relationship_director_verification_additional_document_')) {
              if (global.stripeJS) {
                continue
              }
              const property = field.substring('relationship_director_verification_additional_document_'.length)
              directorInfo.verification = directorInfo.verification || {}
              directorInfo.verification.additional_document = directorInfo.verification.additional_document || {}
              directorInfo.verification.additional_document[property] = director[field]
            } else if (field.startsWith('relationship_director_dob_')) {
              const property = field.substring('relationship_director_dob_'.length)
              directorInfo.dob = directorInfo.dob || {}
              directorInfo.dob[property] = director[field]
            } else {
              if (field === 'relationship_director_relationship_title') {
                directorInfo.relationship = directorInfo.relationship || {}
                directorInfo.relationship.title = director[field]
                continue
              }
              const property = field.substring('relationship_director_'.length)
              if (property === 'relationship_title' || property === 'executive' || property === 'director') {
                continue
              }
              directorInfo[property] = director[field]
            }
          }
        }
        try {
          const person = await stripe.accounts.updatePerson(req.query.stripeid, director.personid, directorInfo, req.stripeKey)
          persons.push({ personid: person.id })
        } catch (error) {
          const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
          throw new Error(errorMessage)
        }
      }
    }
    const accountInfo = {
      metadata: {},
      business_profile: {},
      company: {
        directors_provided: true
      }
    }
    connect.MetaData.store(stripeAccount.metadata, 'directors', persons)
    for (const field in stripeAccount.metadata) {
      if (field.startsWith('directors')) {
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
