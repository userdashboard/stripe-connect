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
    return dashboard.StorageList.count(`${req.appid}/account/stripeAccounts/${req.query.accountid}`)
  }
}
