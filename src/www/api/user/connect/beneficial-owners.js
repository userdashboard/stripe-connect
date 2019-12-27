const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      console.log('bad1')
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      console.log('bad2')
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.business_type !== 'company') {
      console.log('bad3')
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      console.log('no ids of owners')
      return null
    }
    const ids = JSON.parse(stripeAccount.metadata, 'owners')
    console.log('got ids of owners', ids)
    if (!ids || !ids.length) {
      return null
    }
    const owners = []
    console.log('loading owners', ids)
    for (const id of ids) {
      const person = await stripeCache.retrievePerson(req.query.stripeid, id, req.stripeKey)
      owners.push(person)
    }
    return owners
  }
}
