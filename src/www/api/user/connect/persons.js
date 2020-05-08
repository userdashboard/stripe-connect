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
    let personids
    if (req.query.all) {
      personids = await connect.StorageList.listAll(`${req.appid}/stripeAccount/persons/${req.query.stripeid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      personids = await connect.StorageList.list(`${req.appid}/stripeAccount/persons/${req.query.stripeid}`, offset, limit)
    }
    if (!personids || !personids.length) {
      return
    }
    const persons = []
    for (const id of personids) {
      req.query.personid = id
      const person = await global.api.user.connect.Person.get(req)
      persons.push(person)
    }
    return persons
  }
}
