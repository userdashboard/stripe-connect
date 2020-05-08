const connect = require('../../../../../index.js')
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
    if (!req.body.country || !connect.countrySpecIndex[req.body.country]) {
      throw new Error('invalid-country')
    }
    // TODO: this should be determined through the stripe requirements
    // however the country specs have out-of-date requirement and the
    // account requirements don't exist before creating the account
    const requiresOwners = req.body.country !== 'CA' && req.body.country !== 'HK' && req.body.country !== 'JP'
    const requiresDirectors = req.body.country !== 'CA' && req.body.country !== 'HK' && req.body.country !== 'JP' &&
                              req.body.country !== 'MY' && req.body.country !== 'SG' && req.body.country !== 'US'
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
    const stripeAccount = await stripeCache.execute('accounts', 'create', accountInfo, req.stripeKey)
    await connect.StorageList.add(`${req.appid}/stripeAccounts`, stripeAccount.id)
    await connect.StorageList.add(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, stripeAccount.id)
    await connect.Storage.write(`${req.appid}/map/stripeid/accountid/${stripeAccount.id}`, req.query.accountid)
    return stripeAccount
  }
}
