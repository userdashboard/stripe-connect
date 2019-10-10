const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  substituteFailedDocumentFront: {
    api: {
      get: async (req, res) => {
        res.statusCode = 200
        res.end()
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.token) {
          throw new Error('invalid-token')
        }
        const testNumber = global.testNumber
        const token = req.query.token
        return global.packageJSON.dashboard.server.push({
          after: (req, res) => {
            if (req.method !== 'PATCH' ||
                !req.body ||
                !req.uploads ||
                global.testNumber !== testNumber) {
              return
            }
            if (req.body && req.uploads && req.uploads.individual_verification_document_front) {
              req.body.individual_verification_document_front = token
              delete (req.uploads.individual_verification_document_front)
            }
            if (req.body && req.uploads && req.uploads.relationship_account_opener_verification_document_front) {
              req.body.relationship_account_opener_verification_document_front = token
              delete (req.uploads.relationship_account_opener_verification_document_front)
            }
          }
        })
      }
    }
  },
  substituteFailedDocumentBack: {
    api: {
      get: async (req, res) => {
        res.statusCode = 200
        res.end()
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.token) {
          throw new Error('invalid-token')
        }
        const testNumber = global.testNumber
        const token = req.query.token
        return global.packageJSON.dashboard.server.push((req, res) => {
          if (global.testNumber !== testNumber) {
            return
          }
          if (!req.body || !req.uploads || !req.uploads.individual_verification_document_front) {
            return
          }
          req.body.individual_verification_document_back = token
          delete (req.uploads.individual_verification_document_back)
        })
      }
    }
  },
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
      }
    }
  }
}
