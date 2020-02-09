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
    // TODO: this should be determined through the stripe requirements
    // however the country specs have out-of-date requirement and the
    // account requirements don't exist before creating the account
    const requiresOwners = req.body.country != 'CA' && req.body.country !== 'HK' && req.body.country !== 'JP'
    const requiresDirectors = req.body.country !== 'CA' && req.body.country !== 'HK' && req.body.country !== 'JP' && 
                              req.body.country !==  'MY' && req.body.country !== 'SG' && req.body.country !== 'US'
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
        console.log(stripeAccount.country, stripeAccount.metadata, 'owners', stripeAccount.requirements.currently_due.indexOf('relationship.owner') > -1, 'directors', stripeAccount.requirements.currently_due.indexOf('relationship.director') > -1)
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
