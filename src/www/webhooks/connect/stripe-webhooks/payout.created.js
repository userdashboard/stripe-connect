const connect = require('../../../../../index.js')

module.exports = async (stripeEvent, req) => {
  const payout = stripeEvent.data.object
  let accountid
  try {
    accountid = await connect.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
  } catch (error) {
  }
  if (!accountid) {
    return
  }
  await connect.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
  await connect.StorageList.addMany({
    [`${req.appid}/payouts`]: payout.id,
    [`${req.appid}/bankAccount/payouts/${payout.destination}`]: payout.id,
    [`${req.appid}/account/payouts/${accountid}`]: payout.id,
    [`${req.appid}/stripeAccount/payouts/${stripeEvent.account}`]: payout.id
  })
}
