const dashboard = require('@userdashboard/dashboard')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const exists = await dashboard.StorageList.exists(`${req.appid}/stripeAccounts`, req.query.stripeid)
    if (!exists) {
      throw new Error('invalid-stripeid')
    }
    const owned = await dashboard.StorageList.exists(`${req.appid}/account/stripeAccounts/${req.account.accountid}`, req.query.stripeid)
    if (!owned) {
      throw new Error('invalid-account')
    }
    let stripeAccount
    while (true) {
      try {
        stripeAccount = await stripeCache.retrieve(req.query.stripeid, 'accounts', req.stripeKey)
        break
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.raw && error.raw.code === 'rate_limit') {
          continue
        }
        if (error.raw && error.raw.code === 'account_invalid') {
          continue
        }
        if (error.raw && error.raw.code === 'idempotency_key_in_use') {
          continue
        }
        if (error.raw && error.raw.code === 'resource_missing') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.type === 'StripeAPIError') {
           continue
        }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        throw new Error('unknown-error')
      }
    }
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    return stripeAccount
  }
}
