const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

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
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-account')
    }
    if (!stripeAccount.metadata.owners ||
        stripeAccount.metadata.owners === '[]') {
      return null
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    for (const owner of owners) {
      if (owner.ownerid === req.query.ownerid) {
        if (owner.personid) {
          return stripeCache.retrievePerson(owner.personid, req.stripeKey)
        }
        return owner
      }
    }
    throw new Error('invalid-ownerid')
  }
}
