module.exports = {
  after: bindStripeKey
}

async function bindStripeKey (req) {
  req.stripeKey = req.stripeKey || {
    api_key: process.env.STRIPE_KEY
  }
}
