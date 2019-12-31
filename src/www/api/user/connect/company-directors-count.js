const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-personid')
    }
    if (stripeAccount.business_type !== 'company') {
      throw new Error('invalid-stripe-account') 
    }
    const countrySpec = connect.countrySpecIndex[stripeAccount.country]
    if (countrySpec.verification_fields.company.minimum.indexOf('relationship.director') === -1) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.directors || stripeAccount.metadata.directors === '[]') {
      return null
    }
    const directors = JSON.parse(stripeAccount.metadata.directors)
    return directors ? directors.length : 0
  }
}
