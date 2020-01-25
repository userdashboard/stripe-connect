const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const add = []
  const payout = stripeEvent.data.object
  let exists
  while (true) {
    if (global.testEnded) {
      return
    }
    try {
      exists = await stripe.accounts.retrieve(payout.account, req.stripeKey)
      if (exists) {
        break
      }
      return
    } catch (error) {
      if (error.raw && error.raw.code === 'lock_timeout') {
        continue
      }
      if (error.raw && error.raw.code === 'rate_limit') {
        continue
      }
      if (error.raw && error.raw.code === 'idempotency_key_in_use') {
        continue
      }
      if (error.type === 'StripeConnectionError') {
        continue
      }
      return
    }
  }
  let accountid
  try {
    accountid = await dashboard.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
  } catch (error) {
  }
  if (!accountid) {
    return
  }
  await stripeCache.update(payout)
  await dashboard.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
  add.push({ index: `${req.appid}/payouts`, value: payout.id })
  add.push({ index: `${req.appid}/bankAccount/payouts/${payout.destination}`, value: payout.id })
  add.push({ index: `${req.appid}/account/payouts/${accountid}`, value: payout.id })
  add.push({ index: `${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
  for (const item of add) {
    await dashboard.StorageList.add(item.index, item.value)
  }
}
