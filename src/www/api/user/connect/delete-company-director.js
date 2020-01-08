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
    req.query.stripeid = director.account
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount || stripeAccount.business_type !== 'company') {
      throw new Error('invalid-personid')
    }
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const directors = await global.api.user.connect.CompanyDirectors.get(req)
    for (const i in directors) {
      if (directors[i].id !== req.query.personid) {
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
    while (true) {
      try {
        const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
        await stripeCache.update(accountNow)
        await dashboard.Storage.deleteFile(`${req.appid}/map/personid/stripeid/${req.query.personid}`)
        return true
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
