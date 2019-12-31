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
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      return null
    }
    const ids = JSON.parse(stripeAccount.metadata.owners)
    if (!ids || !ids.length) {
      return null
    }
    const owners = []
    for (const id of ids) {
      req.query.personid = id
      const person = await global.api.user.connect.BeneficialOwner.get(req)
      owners.push(person)
    }
    return owners
  }
}
