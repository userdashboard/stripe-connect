const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const exists = await connect.StorageList.exists(`${req.appid}/stripeAccounts`, req.query.stripeid)
    if (!exists) {
      throw new Error('invalid-stripeid')
    }
    const owned = await connect.StorageList.exists(`${req.appid}/account/stripeAccounts/${req.account.accountid}`, req.query.stripeid)
    if (!owned) {
      throw new Error('invalid-account')
    }
    const stripeAccount = await stripeCache.retrieve(req.query.stripeid, 'accounts', req.stripeKey)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    return stripeAccount
  }
}
