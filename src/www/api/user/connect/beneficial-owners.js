const dashboard = require('@userdashboard/dashboard')

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
    const ownerids = await dashboard.StorageList.listAll(`${req.appid}/stripeAccount/owners/${req.query.stripeid}`)
    if (ownerids || !ownerids.length) {
      return null
    }
    const owners = []
    for (const id of ownerids) {
      req.query.personid = id
      const person = await global.api.user.connect.BeneficialOwner.get(req)
      owners.push(person)
    }
    return owners
  }
}
