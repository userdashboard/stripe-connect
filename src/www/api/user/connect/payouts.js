const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let payoutids
    if (req.query.all) {
      payoutids = await dashboard.StorageList.listAll(`${req.appid}/account/payouts/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      payoutids = await dashboard.StorageList.list(`${req.appid}/account/payouts/${req.query.accountid}`, offset)
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
