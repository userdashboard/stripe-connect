const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    let index
    if (req.query && req.query.accountid) {
      index = `${req.appid}/account/stripeAccounts/${req.query.accountid}`
    } else {
      index = `${req.appid}/stripeAccounts`
    }
    return dashboard.StorageList.count(index)
  }
}
