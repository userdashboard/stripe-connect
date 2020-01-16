const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const stripeid = await dashboard.Storage.read(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
    if (!stripeid) {
      throw new Error('invalid-personid')
    }
    req.query.stripeid = stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-personid')
    }
    if (stripeAccount.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      throw new Error('invalid-personid')
    }
    const owners = JSON.parse(stripeAccount.metadata.owners)
    if (owners.indexOf(req.query.personid) === -1) {
      throw new Error('invalid-personid')
    }
    let person
    while (true) {
      try {
        person = await stripeCache.retrievePerson(stripeid, req.query.personid, req.stripeKey)
        break
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
       if (error.type === 'StripeAPIError') {
          continue
       }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
    if (!person) {
      throw new Error('invalid-personid')
    }
    if (person.relationship.owner !== true) {
      throw new Error('invalid-person')
    }
    return person
  }
}
