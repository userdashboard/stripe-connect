const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const exists = await connect.StorageList.exists(`${req.appid}/persons`, req.query.personid)
    if (!exists) {
      throw new Error('invalid-personid')
    }
    const stripeid = await connect.Storage.read(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
    if (!stripeid) {
      throw new Error('invalid-personid')
    }
    req.query.stripeid = stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    const accountKey = {
      apiKey: req.stripeKey.apiKey,
      stripe_account: stripeid
    }
    const person = await stripeCache.retrievePerson(stripeid, req.query.personid, accountKey)
    if (!person) {
      throw new Error('invalid-personid')
    }
    return person
  }
}
