const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  fakePayout: {
    api: {
      get: async (req, res) => {
        res.statusCode = 200
        res.end()
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.stripeid) {
          throw new Error('invalid-stripeid')
        }
        const stripeAccount = await stripe.accounts.retrieve(req.query.stripeid, req.stripeKey)
        if (!stripeAccount.payouts_enabled) {
          throw new Error('invalid-stripe-account')
        }
        req.stripeKey.stripe_account = req.query.stripeid
        const chargeInfo = {
          amount: 2500,
          currency: stripeAccount.default_currency,
          source: 'tok_bypassPending',
          description: 'Test charge'
        }
        await stripe.charges.create(chargeInfo, req.stripeKey)
        const payoutInfo = {
          amount: 2000,
          currency: stripeAccount.default_currency,
          metadata: {
            appid: req.appid,
            testNumber: global.testNumber,
            accountid: req.account.accountid,
            stripeid: req.query.stripeid
          }
        }
        await stripe.payouts.create(payoutInfo, req.stripeKey)
      }
    }
  }
}
