const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)

module.exports = async (stripeEvent, req) => {
  const add = []
  const payout = stripeEvent.data.object
  let accountid
  try {
    accountid = await dashboard.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
  } catch (error) {
  }
  if (!accountid) {
    return
  }
  await dashboard.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
  add.push({ index: `${req.appid}/payouts`, value: payout.id })
  add.push({ index: `${req.appid}/bankAccount/payouts/${payout.destination}`, value: payout.id })
  add.push({ index: `${req.appid}/account/payouts/${accountid}`, value: payout.id })
  add.push({ index: `${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
  for (const item of add) {
    await dashboard.StorageList.add(item.index, item.value)
  }
}
