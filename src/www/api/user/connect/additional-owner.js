const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    const stripeid = await dashboard.Storage.read(`${req.appid}/map/ownerid/stripeid/${req.query.ownerid}`)
    if (!stripeid) {
      throw new Error('invalid-ownerid')
    }
    req.query.stripeid = stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (!stripeAccount) {
      throw new Error('invalid-account')
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec._get(req)
    if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
        countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      return null
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    for (const owner of owners) {
      if (owner.ownerid === req.query.ownerid) {
        return owner
      }
    }
    throw new Error('invalid-ownerid')
  }
}
