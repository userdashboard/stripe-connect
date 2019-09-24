const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = async (stripeEvent, req) => {
  try {
    const add = []
    const payout = stripeEvent.data.object
    const accountid = await dashboard.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
    await dashboard.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
    add.push({ index: `${req.appid}/payouts`, value: payout.id })
    add.push({ index: `${req.appid}/bankAccount/payouts/${payout.destination}`, value: payout.id })
    add.push({ index: `${req.appid}/account/payouts/${accountid}`, value: payout.id })
    add.push({ index: `${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
    if (add.length) {
      for (const item of add) {
        await dashboard.StorageList.add(item.index, item.value)
      }
    }
  } catch (error) {
    console.log(error)
  }
}
