const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const stripeid = await dashboard.Storage.read(`${req.appid}/map/ownerid/stripeid/${req.query.personid}`)
    if (!stripeid) {
      throw new Error('invalid-personid')
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
      if (owner.personid === req.query.personid) {
        if (owner.personid) {
          return stripeCache.retrievePerson(owner.personid, req.stripeKey)
        }
        return owner
      }
    }
    throw new Error('invalid-personid')
  }
}
