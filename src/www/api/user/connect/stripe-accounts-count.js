const dashboard = require('@userappstore/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return dashboard.StorageList.count(`${req.appid}/account/stripeAccounts/${req.query.accountid}`)
  }
}
