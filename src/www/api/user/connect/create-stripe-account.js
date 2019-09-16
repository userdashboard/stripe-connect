const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

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
    if (!req.body.country) {
      throw new Error('invalid-country')
    }
    req.query.country = req.body.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    if (!countrySpec) {
      throw new Error('invalid-country')
    }
    const accountInfo = {
      type: 'custom',
      business_type: req.body.type,
      country: req.body.country,
      metadata: {
        appid: req.appid,
        accountid: req.query.accountid,
        ip: req.ip,
        userAgent: req.userAgent
      }
    }
    if (req.body.country === 'US') {
      accountInfo.requested_capabilities = ['card_payments', 'transfers']
    }
    try {
      const stripeAccount = await stripe.accounts.create(accountInfo, req.stripeKey)
      await dashboard.StorageList.add(`${req.appid}/stripeAccounts`, stripeAccount.id)
      await dashboard.StorageList.add(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, stripeAccount.id)
      await dashboard.Storage.write(`${req.appid}/map/stripeid/accountid/${stripeAccount.id}`, req.query.accountid)
      req.success = true
      await stripeCache.update(stripeAccount, req.stripeKey)
      return stripeAccount
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
