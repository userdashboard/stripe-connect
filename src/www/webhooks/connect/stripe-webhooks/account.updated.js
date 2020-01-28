const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const account = stripeEvent.data.object
  if (account.metadata.template) {
    return
  }
  console.log('got account update', 1, account.id)
  let exists
  while (true) {
    if (global.testEnded) {
      return
    } 
    try {
      exists = await stripe.accounts.retrieve(account.id, req.stripeKey)
      break
    } catch (error) {
      console.log('got account update', 2, error.raw ? error.raw.code : error.type || error.message, account.id)
      if (error.raw && error.raw.code === 'lock_timeout') {
        continue
      }
      if (error.raw && error.raw.code === 'rate_limit') {
        continue
      }
      if (error.raw && error.raw.code === 'account_invalid') {
        continue
      }
      if (error.raw && error.raw.code === 'idempotency_key_in_use') {
        continue
      }
      if (error.raw && error.raw.code === 'resource_missing') {
        continue
      }
      if (error.type === 'StripeConnectionError') {
        continue
      }
      if (error.type === 'StripeAPIError') {
        continue
      }
      if (process.env.DEBUG_ERRORS) { console.log('webhook error', stripeEvent.type, error, stripeEvent) }
      if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
        console.log('webhook update failed ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
      } else {
        console.log('webhook update failed')
      }
      return
    }
  }
  console.log('got account update', 3, account.id)
  if (exists) {
    if (global.testEnded) {
      if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
        console.log('webhook after tests ended ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
      } else {
        console.log('webhook after tests ended')
      }
      console.log('got account update', 4, account.id)
      return
    }
    if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
      console.log('updating cache ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
    } else {
      console.log('updating cache')
    }
    console.log('got account update', 5, account.id)
    return stripeCache.update(exists)
  }
  console.log('got account update', 6, account.id)
  if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
    console.log('webhook ended without finding account ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
  } else {
    console.log('webhook ended without finding account')
  }
}
