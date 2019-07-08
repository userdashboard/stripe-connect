const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    return dashboard.StorageList.count(`${req.appid}/stripeAccount/payouts/${req.query.stripeid}`)
  }
}
