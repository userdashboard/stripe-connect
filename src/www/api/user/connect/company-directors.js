const connect = require('../../../../../index.js')
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
    const countrySpec = connect.countrySpecIndex[stripeAccount.country]
    if (countrySpec.verification_fields.company.minimum.indexOf('relationship.director') === -1) {
      throw new Error('invalid-stripe-account')
    }
    const directors = JSON.stringify(stripeAccount.metadata, 'directors')
    const persons = []
    if (directors && directors.length) {
      for (const director of directors) {
        if (director.personid) {
          const person = await stripeCache.retrievePerson(req.query.stripeid, director.personid, req.stripeKey)
          persons.push(person)
        }
      }
    }
    return persons.length ? persons : directors
  }
}
