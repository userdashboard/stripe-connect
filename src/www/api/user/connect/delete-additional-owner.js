const connect = require('../../../../../index.js')
const dashboard = require('@userappstore/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    const owner = await global.api.user.connect.AdditionalOwner._get(req)
    req.query.stripeid = owner.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted || stripeAccount.metadata.submittedOwners) {
      throw new Error('invalid-stripe-account')
    }
    const owners = await global.api.user.connect.AdditionalOwners._get(req)
    for (const i in owners) {
      if (owners[i].ownerid !== req.query.ownerid) {
        continue
      }
      owners.splice(i, 1)
      break
    }
    req.data = { stripeAccount, owners }
  },
  delete: async (req) => {
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', req.data.owners)
    try {
      const accountNow = await stripe.accounts.update(req.data.stripeAccount.id, accountInfo, req.stripeKey)
      await dashboard.Storage.deleteFile(`${req.appid}/map/ownerid/stripeid/${req.query.ownerid}`)
      req.success = true
      await stripeCache.update(accountNow, req.stripeKey)
      return accountNow
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
