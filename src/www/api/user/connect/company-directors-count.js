const connect = require('../../../../../index.js')
const euCountries = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE']

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
    if (euCountries.indexOf(stripeAccount.country) === -1) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.directors || stripeAccount.metadata.directors === '[]') {
      return null
    }
    const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
    return directors ? directors.length : 0
  }
}
