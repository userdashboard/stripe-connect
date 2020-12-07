module.exports = {
  after: bindStripeKey
}

async function bindStripeKey (req) {
  req.stripeKey = req.stripeKey || {
    apiKey: process.env.STRIPE_KEY
  }
}
