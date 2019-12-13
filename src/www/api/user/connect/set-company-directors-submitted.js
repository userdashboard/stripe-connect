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
      (stripeAccount.company && stripeAccount.company.directors_provided) ||
      connect.kycRequirements[stripeAccount.country].companyDirector === undefined) {
      throw new Error('invalid-stripe-account')
    }
    if (global.stripeJS !== 3) {
      const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
      if (directors && directors.length) {
        for (const director of directors) {
          const directorInfo = {
            first_name: director.relationship_director_first_name,
            last_name: director.relationship_director_last_name,
            relationship: {
              director: true
            },
            verification: {
              document: {
                front: director.relationship_director_verification_document_front,
                back: director.relationship_director_verification_document_back
              }
            }
          }
          if (director.email) {
            directorInfo.email = director.email
          }
          if (director.phone) {
            directorInfo.phone = director.phone
          }
          if (director.relationship_director_dob_day) {
            directorInfo.dob = {
              day: director.relationship_director_dob_day,
              month: director.relationship_director_dob_month,
              year: director.relationship_director_dob_year
            }
          }
          try {
            await stripe.accounts.createPerson(req.query.stripeid, directorInfo, req.stripeKey)
          } catch (error) {
            const errorMessage = error.raw && error.raw.param ? error.raw.param : error.message
            throw new Error(errorMessage)
          }
        }
      }
    }
    const accountInfo = {
      metadata: {
        submittedDirectors: dashboard.Timestamp.now
      },
      business_profile: {},
      company: {
        directors_provided: true
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
