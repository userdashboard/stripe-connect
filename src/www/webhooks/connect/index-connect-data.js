const fs = require('fs')
const path = require('path')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
const Log = require('@userdashboard/src/log.js')('stripe-connect')
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
      if (req.bodyRaw.indexOf('appid') > -1 && req.bodyRaw.indexOf(global.testNumber) === -1) {
        return res.end()
      }
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || global.connectWebhookEndPointSecret)
    } catch (error) {
    }
    if (!stripeEvent) {
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
    if (supportedWebhooks[stripeEvent.type]) {
      try {
        await supportedWebhooks[stripeEvent.type](stripeEvent, req)
      } catch (error) {
        res.statusCode = 500
        Log.error('connect webhook error', JSON.stringify(error, null, '  '))
      }
    }
    if (global.testNumber) {
      global.webhooks.unshift(stripeEvent)
    }
    return res.end()
  }
}
