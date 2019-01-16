const dashboard = require('@userappstore/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    req.stripeAccount = stripeAccount
  },
  delete: async (req) => {
    try {
      if (req.stripeAccount.metadata.owners) {
        const owners = await global.api.user.connect.AdditionalOwners._get(req)
        for (const owner of owners) {
          await dashboard.Storage.deleteFile(`${req.appid}/map/ownerid/stripeid/${owner.ownerid}`)
        }
      }
      await stripe.accounts.del(req.query.stripeid, req.stripeKey)
      await dashboard.StorageList.remove(`${req.appid}/stripeAccounts`, req.query.stripeid)
      await dashboard.StorageList.remove(`${req.appid}/account/stripeAccounts/${req.account.accountid}`, req.query.stripeid)
      req.success = true
      await stripeCache.delete(req.query.stripeid)
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
