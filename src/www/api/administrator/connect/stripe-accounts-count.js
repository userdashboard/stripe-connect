const dashboard = require('@userappstore/dashboard')

module.exports = {
  get: async (req) => {
    return dashboard.StorageList.count(`${req.appid}/stripeAccounts`)
  }
}
