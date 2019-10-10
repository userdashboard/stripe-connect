const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      !stripeAccount.requirements.details_code) {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads.document_front) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.document_front.name,
          data: req.uploads.document_front.buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body.document_front = file.id
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    if (req.uploads.document_back) {
      const uploadData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.document_back.name,
          data: req.uploads.document_back.buffer
        }
      }
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        req.body.document_back = file.id
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    if (!req.body.document_front && !req.body.document.back) {
      throw new Error('invalid-upload')
    }
    if (stripeAccount.business_type === 'individual') {
      const accountInfo = {
        individual: {
          verification: {
            document: {
              front: req.body.document_front,
              back: req.body.document_back
            }
          }
        }
      }
      console.log('updating stripe account', accountInfo)
      try {
        const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
        req.success = true
        return accountNow
      } catch (error) {
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        throw new Error('unknown-error')
      }
    }
    const accountOpenerInfo = {
      verification: {
        document: {
          front: req.body.document_front,
          back: req.body.document_back
        }
      }
    }
    console.log('updating person', accountOpenerInfo)
    try {
      const accountNow = await stripe.accounts.updatePerson(req.query.stripeid, accountOpenerInfo, req.stripeKey)
      req.success = true
      return accountNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
