const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = async (stripeEvent, req) => {
  const person = stripeEvent.data.object
  try {
    const exists = await stripe.accounts.retrievePerson(person.account, person.id, req.stripeKey)
    if (exists) {
      await stripeCache.update(exists)
    }
  }  catch (error ){
  }
}
