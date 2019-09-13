global.stripeAPIVersion = '2019-08-14'
global.maximumStripeRetries = parseInt(process.env.MAXIMUM_STRIPE_RETRIES || '2', 10)
global.connectWebhookEndPointSecret = global.connectWebhookEndPointSecret || process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET
if (!global.connectWebhookEndPointSecret) {
  throw new Error('invalid-connect-webhook-endpoint-secret')
}

const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
stripe.setAppInfo({
  version: packageJSON.version,
  name: '@userdashboard/stripe-connect',
  url: 'https://github.com/userdashboard/stripe-connect'
})

module.exports = {
  MetaData: require('./src/meta-data.js')
}
