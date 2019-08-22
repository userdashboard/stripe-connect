const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../stripe-cache.js')

// The creation of objects like charges and invoices that happen
// without user actions are indexed as this webhook is notifed.  All
// other types of data are indexed as created by the user.
module.exports = {
  auth: false,
  post: async (req, res) => {
    // ignore webhooks from old test runs
    if (global.testEnded || (global.testNumber &&
      req.bodyRaw.indexOf('tests_') > -1 &&
      req.bodyRaw.indexOf(`tests_${global.testNumber}`) === -1)) {
      return res.end()
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || process.env.CONNECT_ENDPOINT_SECRET)
    } catch (error) {
    }
    if (!stripeEvent) {
      res.statusCode = 200
      return res.end()
    }
    if (process.env.NODE_ENV === 'testing') {
      if (stripeEvent.data &&
        stripeEvent.data.object &&
        stripeEvent.data.object.metadata &&
        stripeEvent.data.object.metadata.appid &&
        stripeEvent.data.object.metadata.appid !== `tests_${global.testNumber}`) {
        return res.end()
      }
      if (stripeEvent.data &&
        stripeEvent.data.object &&
        stripeEvent.data.object.metadata &&
        stripeEvent.data.object.metadata.accountid) {
        try {
          req.query = req.query || {}
          req.query.accountid = stripeEvent.data.object.metadata.accountid
          await global.api.administrator.Account.get(req)
        } catch (error) {
          return res.end()
        }
      }
      if (stripeEvent.data &&
        stripeEvent.data.account &&
        stripeEvent.data.account.subscription.startsWith('acct')) {
        try {
          req.query = req.query || {}
          req.query.stripeid = stripeEvent.data.account
          await global.api.administrator.connect.StripeAccount.get(req)
        } catch (error) {
          return res.end()
        }
      }
    }
    const add = []
    switch (stripeEvent.type) {
      case 'payout.created':
        const payout = stripeEvent.data.object
        const accountid = await dashboard.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
        await dashboard.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
        add.push({ index: `${req.appid}/payouts`, value: payout.id })
        add.push({ index: `${req.appid}/bankAccount/payouts/${payout.destination}`, value: payout.id })
        add.push({ index: `${req.appid}/account/payouts/${accountid}`, value: payout.id })
        add.push({ index: `${req.appid}/stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
        break
      default:
        if (stripeEvent.account) {
          const stripeAccount = await stripe.accounts.retrieve(stripeEvent.account, req.stripeKey)
          stripeCache.update(stripeAccount, req.stripeKey)
        }
        break
    }
    if (add.length) {
      for (const item of add) {
        await dashboard.StorageList.add(item.index, item.value)
      }
    }
    res.statusCode = 200
    return res.end()
  }
}
