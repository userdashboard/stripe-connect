const connect = require('../../../../../index.js')
const dashboard = require('@userappstore/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.legal_entity.type !== 'company' ||
      stripeAccount.metadata.submittedOwners ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    const requiredFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    const requireOwners = requiredFields.indexOf('legal_entity.additional_owners') > -1
    if (!requireOwners) {
      throw new Error('invalid-stripe-account')
    }
    req.owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    req.stripeAccount = stripeAccount
    req.registration = registration
  },
  patch: async (req) => {
    const accountInfo = {
      legal_entity: {},
      metadata: {
        submittedOwners: dashboard.Timestamp.now
      }
    }
    if (!req.owners || !req.owners.length) {
      accountInfo.legal_entity.additional_owners = ''
    } else {
      accountInfo.legal_entity.additional_owners = {}
      for (const i in req.owners) {
        accountInfo.legal_entity.additional_owners[i] = {
          first_name: req.owners[i].first_name,
          last_name: req.owners[i].last_name,
          address: {
            city: req.owners[i].city,
            country: req.owners[i].country,
            line1: req.owners[i].line1,
            postal_code: req.owners[i].postal_code
          },
          dob: {
            day: req.owners[i].day,
            month: req.owners[i].month,
            year: req.owners[i].year
          },
          verification: {
            document: req.owners[i].documentid
          }
        }
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      req.success = true
      return accountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
