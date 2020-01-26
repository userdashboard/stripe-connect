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
    const director = await global.api.user.connect.CompanyDirector.get(req)
    req.query.stripeid = director.account
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-personid')
    }
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    while (true) {
      try {
        await stripe.accounts.deletePerson(stripeAccount.id, req.query.personid, req.stripeKey)
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
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    await stripeCache.delete(req.query.personid)
    try {
      await dashboard.Storage.deleteFile(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
    } catch (error) {
    }
    try {
      await dashboard.StorageList.remove(`${req.appid}/stripeAccount/directors/${req.query.stripeid}`, req.query.personid)
    } catch (error ){
    }
    return true
  }
}
