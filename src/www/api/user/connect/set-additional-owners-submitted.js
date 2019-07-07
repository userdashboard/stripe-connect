const connect = require('../../../../../index.js')
const dashboard = require('@userappstore/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.legal_entity.type !== 'company' ||
      stripeAccount.metadata.submittedOwners ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec._get(req)
    const requiredFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    const requireOwners = requiredFields.indexOf('legal_entity.additional_owners') > -1
    if (!requireOwners) {
      throw new Error('invalid-stripe-account')
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    const accountInfo = {
      legal_entity: {},
      metadata: {
        submittedOwners: dashboard.Timestamp.now
      }
    }
    if (!owners || !owners.length) {
      accountInfo.legal_entity.additional_owners = ''
    } else {
      accountInfo.legal_entity.additional_owners = {}
      for (const i in owners) {
        accountInfo.legal_entity.additional_owners[i] = {
          first_name: owners[i].first_name,
          last_name: owners[i].last_name,
          address: {
            city: owners[i].city,
            country: owners[i].country,
            line1: owners[i].line1,
            postal_code: owners[i].postal_code
          },
          dob: {
            day: owners[i].day,
            month: owners[i].month,
            year: owners[i].year
          },
          verification: {
            document: owners[i].documentid
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
