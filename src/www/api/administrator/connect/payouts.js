const connect = require('../../../../../index.js')

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
    let payoutids
    if (req.query.all) {
      payoutids = await connect.StorageList.listAll(index)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      payoutids = await connect.StorageList.list(index, offset, limit)
    }
    if (!payoutids || !payoutids.length) {
      return
    }
    const payouts = []
    req.query = req.query || {}
    for (const payoutid of payoutids) {
      req.query.payoutid = payoutid
      const payout = await global.api.administrator.connect.Payout.get(req)
      payouts.push(payout)
    }
    return payouts
  }
}
