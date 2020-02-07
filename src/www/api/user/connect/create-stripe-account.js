const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!req.body || (req.body.type !== 'individual' && req.body.type !== 'company')) {
      throw new Error('invalid-type')
    }
    if (!req.body.country || !connect.countrySpecIndex[req.body.country]) {
      throw new Error('invalid-country')
    }
    // TODO: not sure if the country spec requirements can be relied upon
    // as they have been inconsistent in the past and the requirements
    // are now attached to the Account object, but after the owners and
    // directors are submitted it is ambiguous if they were required
    const countrySpec = connect.countrySpecIndex[req.body.country]
    const requiresOwners = countrySpec.verification_fields.company.additional.indexOf('relationship.owner') > -1 ||
                           countrySpec.verification_fields.company.minimum.indexOf('relationship.owner') > -1
    const requiresDirectors = countrySpec.verification_fields.company.additional.indexOf('relationship.director') > -1 ||
                              countrySpec.verification_fields.company.minimum.indexOf('relationship.director') > -1
    const accountInfo = {
      type: 'custom',
      business_type: req.body.type,
      country: req.body.country,
      requested_capabilities: ['card_payments', 'transfers'],
      metadata: {
        appid: req.appid,
        accountid: req.query.accountid,
        ip: req.ip,
        requiresOwners,
        requiresDirectors
      }
    }
    let stripeAccount
    while (true) {
      try {
        stripeAccount = await stripe.accounts.create(accountInfo, req.stripeKey)
        await dashboard.StorageList.add(`${req.appid}/stripeAccounts`, stripeAccount.id)
        await dashboard.StorageList.add(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, stripeAccount.id)
        await dashboard.Storage.write(`${req.appid}/map/stripeid/accountid/${stripeAccount.id}`, req.query.accountid)
        return stripeAccount
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.raw && error.raw.code === 'resource_missing') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.type === 'StripeAPIError') {
          continue
        }
        if (error.message === 'An error occurred with our connection to Stripe.') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
