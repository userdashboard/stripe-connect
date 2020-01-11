const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const person = stripeEvent.data.object
  while (true) {
    try {
      const exists = await stripe.accounts.retrievePerson(person.account, person.id, req.stripeKey)
      if (exists) {
        const account = await stripe.accounts.retrieve(person.account, req.stripeKey)
        if (account) {
          await stripeCache.update(exists)
          await stripeCache.update(account)
        }
      }
    } catch (error) {
      if (error.raw && error.raw.code === 'lock_timeout') {
        continue
      }
      if (error.type === 'StripeConnectionError') {
        continue
      }
    }
  }
}
