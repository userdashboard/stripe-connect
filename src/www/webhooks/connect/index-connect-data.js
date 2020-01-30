const fs = require('fs')
const path = require('path')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const stripeCache = require('../../../stripe-cache.js')
const webhookPath = path.join(__dirname, '.')
const supportedWebhooks = {}
const subscriptionWebhooks = fs.readdirSync(`${webhookPath}/stripe-webhooks/`)
for (const webhookHandler of subscriptionWebhooks) {
  const type = webhookHandler.substring(0, webhookHandler.indexOf('.js'))
  supportedWebhooks[type] = require(`${webhookPath}/stripe-webhooks/${webhookHandler}`)
}

module.exports = {
  auth: false,
  template: false,
  post: async (req, res) => {
    res.statusCode = 200
    if (!req.body || !req.bodyRaw || global.testEnded) {
      return res.end()
    }
    if (global.testNumber) {
      // if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
      //   console.log('received webhook for monitored account', global.monitorStripeAccount)
      //   console.log(JSON.stringify(JSON.parse(req.bodyRaw), null, '  '))
      // }
      if (req.bodyRaw.indexOf('appid') > -1 && req.bodyRaw.indexOf(global.testNumber) === -1) {
        console.log('webhook ended due to stale test data')
        return res.end()
      }
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || global.connectWebhookEndPointSecret)
    } catch (error) {
      // if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
      //   console.log('webhook failed parsing ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
      // } else {
        // console.log('webhook failed parsing', error)
      // }
    }
    if (!stripeEvent) {
      // if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
      //   console.log('webhook failed due to no event parsed from body ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
      // } else {
      //   console.log('webhook failed due to no event parsed from body')
      // }
      return res.end()
    }
    if (stripeEvent.data.account) {
      await stripeCache.delete(stripeEvent.data.account)
    }
    if (stripeEvent.data.object && 
        stripeEvent.data.object.id && 
        stripeEvent.data.object.id !== stripeEvent.data.account) {
      await stripeCache.delete(stripeEvent.data.object.id)
    }
    // console.log('webhook', global.monitorStripeAccount, stripeEvent.type, stripeEvent.data.object ? stripeEvent.data.object.id : 'no objectid', stripeEvent)
    if (supportedWebhooks[stripeEvent.type]) {
      try {
        await supportedWebhooks[stripeEvent.type](stripeEvent, req)
      } catch (error) {
        // if (global.testNumber && global.monitorStripeAccount && req.bodyRaw.indexOf(global.monitorStripeAccount) > -1) {
        //   console.log('webhook failed due to error ** for monitored account', global.monitorStripeAccount, req.bodyRaw)
        // } else {
        //   console.log('webhook failed due to error', error)
        // }
        res.statusCode = 500
        if (process.env.DEBUG_ERRORS) {
          console.log('connect webhook error', JSON.stringify(error, null, '  '))
        }
      }
    }
    if (global.testNumber) {
      global.webhooks.unshift(stripeEvent)
    }
    return res.end()
  }
}
