const stripeCache = require('./src/stripe-cache.js')

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
        const stripeAccount = await stripeCache.retrieve(req.query.stripeid, 'accounts', req.stripeKey)
        if (!stripeAccount.payouts_enabled) {
          throw new Error('invalid-stripe-account')
        }
        req.stripeKey.stripeAccount = req.query.stripeid
        const chargeInfo = {
          amount: 2500,
          currency: stripeAccount.default_currency,
          source: 'tok_bypassPending',
          description: 'Test charge'
        }
        await stripeCache.execute('charges', 'create', chargeInfo, req.stripeKey)
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
        const payout = await stripeCache.execute('payouts', 'create', payoutInfo, req.stripeKey)
        return payout
      }
    }
  }
}
