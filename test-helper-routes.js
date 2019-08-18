const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)

// Generating an amount owed when creating documentation screenshots
// and tests require the user have an outstanding balance sometimes
// which isn't possible until a subscription bill comes due so this
// creates a contrived amount
module.exports = {
  fakePayout: {
    api: {
      get: async (req, res) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.stripeid) {
          throw new Error('invalid-stripeid')
        }
        const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
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
        res.statusCode = 200
        return res.end()
      }
    }
  }
}
