const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.directorid) {
      throw new Error('invalid-directorid')
    }
    const stripeid = await dashboard.Storage.read(`${req.appid}/map/directorid/stripeid/${req.query.directorid}`)
    if (!stripeid) {
      throw new Error('invalid-directorid')
    }
    req.query.stripeid = stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-account')
    }
    if (!stripeAccount.metadata.directors || stripeAccount.metadata.directors === '[]') {
      return null
    }
    const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
    for (const director of directors) {
      if (director.directorid === req.query.directorid) {
        if (director.personid) {
          return stripeCache.retrieve(director.personid, req.stripeKey)
        }
        return director
      }
    }
    throw new Error('invalid-directorid')
  }
}
