const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.directorid) {
      throw new Error('invalid-directorid')
    }
    const director = await global.api.user.connect.CompanyDirector.get(req)
    req.query.stripeid = director.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const directors = await global.api.user.connect.CompanyDirectors.get(req)
    for (const i in directors) {
      if (directors[i].directorid !== req.query.directorid) {
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
      await dashboard.Storage.deleteFile(`${req.appid}/map/directorid/stripeid/${req.query.directorid}`)
      req.success = true
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
