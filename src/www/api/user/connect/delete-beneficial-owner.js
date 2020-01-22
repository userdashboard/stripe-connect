const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const owner = await global.api.user.connect.BeneficialOwner.get(req)
    req.query.stripeid = owner.account
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount || stripeAccount.business_type !== 'company') {
      throw new Error('invalid-stripe-account')
    }
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.metadata.owners || stripeAccount.metadata.owners === '[]') {
      throw new Error('invalid-personid')
    }
    const owners = JSON.parse(stripeAccount.metadata.owners)
    for (const i in owners) {
      if (owners[i] !== req.query.personid) {
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
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
