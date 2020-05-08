const connect = require('../../../../../index.js')

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
    const ownerids = await connect.StorageList.listAll(`${req.appid}/stripeAccount/persons/${req.query.stripeid}`)
    if (!ownerids) {
      return 0
    }
    return ownerids.length
  }
}
