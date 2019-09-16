(async () => {
  if (!process.env.CONNECT_WEBHOOK_ENDPOINT_SECRET) {
    const stripe = require('stripe')()
    stripe.setApiVersion(global.stripeAPIVersion)
    stripe.setMaxNetworkRetries(global.maximumStripeRetries)
    const fs = require('fs')
    const events = fs.readdirSync(`${__dirname}/src/www/webhooks/connect/stripe-webhooks`)
    const eventList = []
    for (const event of events) {
      eventList.push(event.substring(0, event.indexOf('.js')))
    }
    const webhook = await stripe.webhookEndpoints.create({
      connect: true,
      url: `${process.env.DASHBOARD_SERVER}/webhooks/connect/index-connect-data`,
      enabled_events: eventList
    }, {
      api_key: process.env.STRIPE_KEY
    })
    global.connectWebhookEndPointSecret = webhook.secret
  }
  require('./index.js')
  const dashboard = require('@userdashboard/dashboard')
  await dashboard.start(__dirname)
  if (process.env.NODE_ENV === 'testing') {
    const helperRoutes = require('./test-helper-routes.js')
    global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  }
})()
