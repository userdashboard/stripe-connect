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
        let stripeAccount
        while (true) {
          try {
            stripeAccount = await stripe.accounts.retrieve(req.query.stripeid, req.stripeKey)
            if (!stripeAccount.payouts_enabled) {
              if (process.env.DEBUG_ERRORS) {
                console.log('payouts not enabled', JSON.stringify(stripeAccount, null, '  '))
              }
              throw new Error('invalid-stripe-account')
            }
            break
          } catch (error) {
            if (error.raw && error.raw.code === 'lock_timeout') {
              continue
            }
            if (error.raw && error.raw.code === 'rate_limit') {
              continue
            }
            if (error.raw && error.raw.code === 'account_invalid') {
              continue
            }
            if (error.raw && error.raw.code === 'idempotency_key_in_use') {
              continue
            }
            if (error.raw && error.raw.code === 'resource_missing') {
              continue
            }
            if (error.type === 'StripeConnectionError') {
              continue
            }
            if (error.type === 'StripeAPIError') {
              continue
            }
            if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
          }
        }
        req.stripeKey.stripe_account = req.query.stripeid
        const chargeInfo = {
          amount: 2500,
          currency: stripeAccount.default_currency,
          source: 'tok_bypassPending',
          description: 'Test charge'
        }
        while (true) {
          try {
            await stripe.charges.create(chargeInfo, req.stripeKey)
            break
          } catch (error) {
            if (error.raw && error.raw.code === 'lock_timeout') {
              continue
            }
            if (error.raw && error.raw.code === 'rate_limit') {
              continue
            }
            if (error.raw && error.raw.code === 'account_invalid') {
              continue
            }
            if (error.raw && error.raw.code === 'idempotency_key_in_use') {
              continue
            }
            if (error.raw && error.raw.code === 'resource_missing') {
              continue
            }
            if (error.type === 'StripeConnectionError') {
              continue
            }
            if (error.type === 'StripeAPIError') {
              continue
            }
            if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
          }
        }
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
        while (true) {
          try {
            const payout = await stripe.payouts.create(payoutInfo, req.stripeKey)
            if (process.env.DEBUG_ERRORS) {
              console.log('created payout', payout)
            }
            return payout
          } catch (error) {
            if (error.raw && error.raw.code === 'lock_timeout') {
              continue
            }
            if (error.raw && error.raw.code === 'rate_limit') {
              continue
            }
            if (error.raw && error.raw.code === 'account_invalid') {
              continue
            }
            if (error.raw && error.raw.code === 'idempotency_key_in_use') {
              continue
            }
            if (error.raw && error.raw.code === 'resource_missing') {
              continue
            }
            if (error.type === 'StripeConnectionError') {
              continue
            }
            if (error.type === 'StripeAPIError') {
              continue
            }
            if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
          }
        }
      }
    }
  }
}
