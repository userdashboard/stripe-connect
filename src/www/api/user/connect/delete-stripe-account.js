const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    try {
      if (stripeAccount.metadata.owners) {
        const owners = await global.api.user.connect.AdditionalOwners.get(req)
        if (owners && owners.length) {
          for (const owner of owners) {
            await dashboard.Storage.deleteFile(`${req.appid}/map/ownerid/stripeid/${owner.ownerid}`)
          }
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
