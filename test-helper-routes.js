const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)

module.exports = {
  fakePayout: {
    api: {
      get: async (req, res) => {
        res.statusCode = 200
        res.end()
        if (process.env.NODE_ENV !== 'testing') {
          console.log('fake payout failed', 'invalid-route')
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.stripeid) {
          console.log('fake payout failed', 'invalid-stripeid')
          throw new Error('invalid-stripeid')
        }
        const stripeAccount = await stripe.accounts.retrieve(req.query.stripeid, req.stripeKey)
        if (!stripeAccount.payouts_enabled) {
          console.log('fake payout failed', 'invalid-stripe-account', JSON.stringify(stirpeAccount, null, '  '))
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
        const payout = await stripe.payouts.create(payoutInfo, req.stripeKey)
        console.log('created payout', payout)
        return payout
      }
    }
  }
}
