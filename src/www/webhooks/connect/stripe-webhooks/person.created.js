const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = async (stripeEvent, req) => {
  const person = stripeEvent.data.object
  if (person.metadata.template) {
    if (person.relationship.representative) {
      while (true) {
        const updateInfo = {
          relationship: {
            representative: false
          }
        }
        try {
          await stripe.accounts.updatePerson(person.account, person.id, updateInfo, req.stripeKey)
        } catch (error) {
          if (error.raw && error.raw.code === 'lock_timeout') {
            continue
          }
          return
        }
      }  
    }
    while (true) {
      try {
        await stripe.accounts.deletePerson(person.account, person.id, req.stripeKey)
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        return
      }
    }
  }
}
