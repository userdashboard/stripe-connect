const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.directors || stripeAccount.metadata.directors === '[]') {
      return null
    }
    const ids = JSON.parse(stripeAccount.metadata, 'directors')
    if (!ids || !ids.length) {
      return null
    }
    const directors = []
    for (const id of ids) {
      const person = await stripeCache.retrievePerson(req.query.stripeid, id, req.stripeKey)
      directors.push(person)
    }
    return directors
  }
}
