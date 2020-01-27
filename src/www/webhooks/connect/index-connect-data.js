const fs = require('fs')
const path = require('path')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
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
      if (req.bodyRaw.indexOf('appid') && req.bodyRaw.indexOf(global.testNumber) === -1) {
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
    if (global.testNumber && global.monitorStripeAccount && stripeEvent.data.object && stripeEvent.data.object.id) {
      if (global.monitorStripeAccount === stripeEvent.data.object.id) {
        console.log('received webhook for monitored account', global.monitorStripeAccount)
        console.log(stripeEvent.type, JSON.stringify(stripeEvent, null, '  '))
      }
    }
    if (global.testNumber) {
      global.webhooks.unshift(stripeEvent)
    }
    if (supportedWebhooks[stripeEvent.type]) {
      try {
        await supportedWebhooks[stripeEvent.type](stripeEvent, req)
      } catch (error) {
        res.statusCode = 500
        if (process.env.DEBUG_ERRORS) {
          console.log('connect webhook error', JSON.stringify(error, null, '  '))
        }
      }
    }
    return res.end()
  }
}
