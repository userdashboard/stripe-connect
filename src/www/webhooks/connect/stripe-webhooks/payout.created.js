const connect = require('../../../../../index.js')

module.exports = async (stripeEvent, req) => {
  const add = []
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
  add.push({ index: `${req.appid}/payouts`, value: payout.id })
  add.push({ index: `${req.appid}/bankAccount/payouts/${payout.destination}`, value: payout.id })
  add.push({ index: `${req.appid}/account/payouts/${accountid}`, value: payout.id })
  add.push({ index: `${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
  for (const item of add) {
    await connect.StorageList.add(item.index, item.value)
  }
}
