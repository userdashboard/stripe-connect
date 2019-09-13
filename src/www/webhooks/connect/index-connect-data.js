const fs = require('fs')
const path = require('path')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
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
    if (!req.body || !req.bodyRaw) {
      return res.end()
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || global.connectWebhookEndPointSecret)
    } catch (error) {
    }
    if (!stripeEvent) {
      return res.end()
    }
    res.statusCode = 200
    if (global.testNumber) {
      global.webhooks = global.webhooks || []
      global.webhooks.unshift(stripeEvent)
    }
    if (supportedWebhooks[stripeEvent.type]) {
      try {
        await supportedWebhooks[stripeEvent.type](stripeEvent, req)
      } catch (error) {
        if (process.env.NODE_ENV === 'testing') {
          return res.end()
        }
        res.statusCode = 500
        if (process.env.DEBUG_ERRORS) {
          console.log('connect webhook error', error)
        }
      }
    }
    return res.end()
  }
}
