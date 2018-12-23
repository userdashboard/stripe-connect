const connect = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
        countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      return null
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    return owners
  }
}
