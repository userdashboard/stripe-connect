const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    let stripeids
    if (req.query.all) {
      stripeids = await dashboard.StorageList.listAll(`${req.appid}/account/stripeAccounts/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) || 0 : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      stripeids = await dashboard.StorageList.list(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, offset, limit)
    }
    if (!stripeids || !stripeids.length) {
      return null
    }
    const stripeAccounts = []
    for (const stripeid of stripeids) {
      req.query.stripeid = stripeid
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount) {
        throw new Error('invalid-stripeid')
      }
      stripeAccounts.push(stripeAccount)
    }
    return stripeAccounts
  }
}
