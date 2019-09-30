const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.administrator.Account.get(req)
    if (!account) {
      throw new Error('invalid-accountid')
    }
    let stripeids
    if (req.query.all) {
      stripeids = await dashboard.StorageList.listAll(`${req.appid}/account/stripeAccounts/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) || 0 : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) || 0 : 0
      stripeids = await dashboard.StorageList.list(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, offset, limit)
    }
    if (!stripeids || !stripeids.length) {
      return null
    }
    const stripeAccounts = []
    for (const stripeid of stripeids) {
      req.query.stripeid = stripeid
      const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
      stripeAccounts.push(stripeAccount)
    }
    return stripeAccounts
  }
}
