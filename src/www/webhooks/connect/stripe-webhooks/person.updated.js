const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const person = stripeEvent.data.object
  let exists
  while (true) {
    if (global.testEnded) {
      return
    }
    try {
      exists = await stripe.accounts.retrievePerson(person.account, person.id, req.stripeKey)
      if (exists) {
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
      if (error.raw && error.raw.code === 'idempotency_key_in_use') {
        continue
      }
      if (error.type === 'StripeConnectionError') {
        continue
      }
      return
    }
  }
}
