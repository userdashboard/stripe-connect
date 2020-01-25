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
    if (!directorids || !directorids.length || directorids.indexOf(req.query.personid) === -1) {
      throw new Error('invalid-personid')
    }
    if (!directorids || !directorids.length) {
      return null
    }
    const directors = []
    for (const id of directorids) {
      req.query.personid = id
      const person = await global.api.user.connect.CompanyDirector.get(req)
      directors.push(person)
    }
    return directors
  }
}
