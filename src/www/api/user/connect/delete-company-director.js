const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const director = await global.api.user.connect.CompanyDirector.get(req)
    req.query.stripeid = director.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const directors = await global.api.user.connect.CompanyDirectors.get(req)
    for (const i in directors) {
      if (directors[i].personid !== req.query.personid) {
        continue
      }
      directors.splice(i, 1)
      break
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'directors', directors)
    try {
      const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow)
      await dashboard.Storage.deleteFile(`${req.appid}/map/directorid/stripeid/${req.query.personid}`)
      req.success = true
      return true
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
