const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)

module.exports = async (stripeEvent, req) => {
  const person = stripeEvent.data.object
  if (person.metadata.template) {
    if (person.relationship.representative) {
      return
    }
    while (true) {
      if (global.testEnded) {
        return
      }
      try {
        return stripe.accounts.deletePerson(person.account, person.id, req.stripeKey)
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
}
