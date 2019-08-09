const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
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
      country: req.body.country,
      metadata: {
        accountid: req.query.accountid,
        ip: req.ip,
        userAgent: req.userAgent
      },
      legal_entity: {
        type: req.body.type
      }
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
