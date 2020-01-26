const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)

module.exports = {
  fakePayout: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.stripeid) {
          throw new Error('invalid-stripeid')
        }
        const stripeAccount = await stripe.accounts.retrieve(req.query.stripeid, req.stripeKey)
        if (!stripeAccount.payouts_enabled) {
          if (process.env.DEBUG_ERRORS) {
            console.log('payouts not enabled', JSON.stringify(stripeAccount, null, '  '))
          }
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
        return payout
      }
    }
  }
}
