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
    const owner = await global.api.user.connect.BeneficialOwner.get(req)
    req.query.stripeid = owner.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const owners = await global.api.user.connect.BeneficialOwners.get(req)
    for (const i in owners) {
      if (owners[i].personid !== req.query.personid) {
        continue
      }
      owners.splice(i, 1)
      break
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', owners)
    try {
      const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow)
      await dashboard.Storage.deleteFile(`${req.appid}/map/ownerid/stripeid/${req.query.personid}`)
      req.success = true
      return true
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
