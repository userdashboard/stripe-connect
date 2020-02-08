const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const person = await global.api.user.connect.Person.get(req)
    if (!person) {
      throw new Error('invalid-personid')
    }
    if (person.relationship.representative) {
      throw new Error('invalid-person')
    }
    while (true) {
      try {
        await stripe.accounts.deletePerson(person.account, req.query.personid, req.stripeKey)
        break
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
        if (error.message === 'An error occurred with our connection to Stripe.') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    await stripeCache.delete(req.query.personid)
    try {
      await dashboard.Storage.deleteFile(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
    } catch (error) {
    }
    try {
      await dashboard.StorageList.remove(`${req.appid}/stripeAccount/persons/${req.query.stripeid}`, req.query.personid)
    } catch (error) {
    }
    try {
      await dashboard.StorageList.remove(`${req.appid}/persons`, req.query.personid)
    } catch (error) {
    }
    return true
  }
}
