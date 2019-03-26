const dashboard = require('@userappstore/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../stripe-cache.js')

// The creation of objects like charges and invoices that happen
// without user actions are indexed as this webhook is notifed.  All
// other types of data are indexed as created by the user.
module.exports = {
  auth: false,
  post: async (req, res) => {
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], process.env.CONNECT_ENDPOINT_SECRET)
    } catch (error) {
    }
    if (!stripeEvent) {
      res.statusCode = 200
      return res.end()
    }
    const add = []
    switch (stripeEvent.type) {
      case 'payout.created':
        const payout = stripeEvent.data.object
        const accountid = await dashboard.Storage.read(`${req.appid}/map/stripeid/accountid/${stripeEvent.account}`)
        await dashboard.Storage.write(`${req.appid}/map/payoutid/stripeid/${payout.id}`, stripeEvent.account)
        add.push({ index: 'payouts', value: payout.id })
        add.push({ index: `bankAccount/payouts/${payout.destination}`, value: payout.id })
        add.push({ index: `account/payouts/${accountid}`, value: payout.id })
        add.push({ index: `stripeAccount/payouts/${stripeEvent.account}`, value: payout.id })
        break
      default:
        if (!stripeEvent.data || !stripeEvent.data.object || !stripeEvent.data.object.id) {
          res.statusCode = 200
          return res.end()
        }
        if (stripeEvent.type.endsWith('.updated')) {
          await stripeCache.update(stripeEvent.data.object, req.stripeKey)
        } else if (stripeEvent.type.endsWith('.deleted')) {
          await stripeCache.delete(stripeEvent.data.object.id, req.stripeKey)
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
