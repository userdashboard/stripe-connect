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
  await connect.StorageList.add(`${req.appid}/payouts`, payout.id)
  await connect.StorageList.add(`${req.appid}/bankAccount/payouts/${payout.destination}`, payout.id)
  await connect.StorageList.add(`${req.appid}/account/payouts/${accountid}`, payout.id)
  await connect.StorageList.add(`${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, payout.id)
}
