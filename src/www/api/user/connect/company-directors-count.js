const dashboard = require('@userdashboard/dashboard')

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
    const directorids = await dashboard.StorageList.listAll(`${req.appid}/stripeAccount/directors/${req.query.stripeid}`)
    if (!directorids || !directorids.length) {
      return 0
    }
    return directorids.length
  }
}
