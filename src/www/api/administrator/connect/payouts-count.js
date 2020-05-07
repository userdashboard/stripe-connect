const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let index
    if (req.query.stripeid) {
      index = `${req.appid}/stripeAccount/payouts/${req.query.stripeid}`
    } else if (req.query.accountid) {
      index = `${req.appid}/account/payouts/${req.query.accountid}`
    } else {
      index = `${req.appid}/payouts`
    }
    return dashboard.StorageList.count(index)
  }
}
