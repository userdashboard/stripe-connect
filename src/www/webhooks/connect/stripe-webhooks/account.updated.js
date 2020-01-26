const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const account = stripeEvent.data.object
  while (true) {
    if (global.testEnded) {
      return
    }
    if (account.metadata.template) {
      return
    }
    try {
      const exists = await stripe.accounts.retrieve(account.id, req.stripeKey)
      if (exists) {
        if (global.testEnded) {
          return
        }
        await stripeCache.update(exists)
      }
      return
    } catch (error) {
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
      return
    }
  }
}
