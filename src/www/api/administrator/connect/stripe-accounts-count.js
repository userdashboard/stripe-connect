const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    let index
    if (req.query && req.query.accountid) {
      index = `${req.appid}/account/stripeAccounts/${req.query.accountid}`
    } else {
      index = `${req.appid}/stripeAccounts`
    }
    return connect.StorageList.count(index)
  }
}
