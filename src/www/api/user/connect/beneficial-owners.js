const stripeCache = require('../../../../stripe-cache.js')

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
    const owners = JSON.stringify(stripeAccount.metadata, 'owners')
    const people = []
    for (const owner of owners) {
      if (owner.personid) {
        const person = await stripeCache.retrievePerson(req.query.stripeid, owner.personid, req.stripeKey)
        people.push(person)
      }
    }
    return people.length ? people : owners
  }
}
