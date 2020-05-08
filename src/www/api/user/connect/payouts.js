const connect = require('../../../../../index.js')

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
      const owned = await connect.StorageList.exists(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, req.query.stripeid)
      if (!owned) {
        throw new Error('invalid-stripeid')
      }
      index = `${req.appid}/stripeAccount/payouts/${req.query.stripeid}`
    } else {
      index = `${req.appid}/account/payouts/${req.query.accountid}`
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
    for (const payoutid of payoutids) {
      req.query.payoutid = payoutid
      const payout = await global.api.user.connect.Payout.get(req)
      payouts.push(payout)
    }
    if (!payouts || !payouts.length) {
      return null
    }
    return payouts
  }
}
