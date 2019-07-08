const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    return dashboard.StorageList.count(`${req.appid}/payouts`)
  }
}
