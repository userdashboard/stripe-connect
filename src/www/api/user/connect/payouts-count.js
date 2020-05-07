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
    let index
    if (req.query.stripeid) {
      const owned = await dashboard.StorageList.exists(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, req.query.stripeid)
      if (!owned) {
        throw new Error('invalid-stripeid')
      }
      index = `${req.appid}/stripeAccount/payouts/${req.query.stripeid}`
    } else {
      index = `${req.appid}/account/payouts/${req.query.accountid}`
    }
    return dashboard.StorageList.count(index)
  }
}
