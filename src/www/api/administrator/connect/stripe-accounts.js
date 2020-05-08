const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let stripeids
    let index
    if (req.query.accountid) {
      const account = await global.api.administrator.Account.get(req)
      if (!account) {
        throw new Error('invalid-accountid')
      }
      index = `${req.appid}/account/stripeAccounts/${req.query.accountid}`
    } else {
      index = `${req.appid}/stripeAccounts`
    }
    if (req.query.all) {
      stripeids = await connect.StorageList.listAll(index)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) || 0 : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) || 0 : global.pageSize
      stripeids = await connect.StorageList.list(index, offset, limit)
    }
    if (!stripeids || !stripeids.length) {
      return null
    }
    const stripeAccounts = []
    req.query = req.query || {}
    for (const stripeid of stripeids) {
      req.query.stripeid = stripeid
      const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      stripeAccounts.push(stripeAccount)
    }
    return stripeAccounts
  }
}
