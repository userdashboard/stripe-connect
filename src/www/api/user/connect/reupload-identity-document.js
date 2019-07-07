const stripe = require('stripe')()

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (!stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid ||
      !stripeAccount.legal_entity.verification.details_code) {
      throw new Error('invalid-stripe-account')
    }
    const uploadData = {
      purpose: 'identity_document',
      file: {
        type: 'application/octet-stream'
      }
    }
    if (req.uploads['id_scan.jpg']) {
      uploadData.file.name = 'id_scan.jpg'
      uploadData.file.data = req.uploads['id_scan.jpg'].buffer
    } else {
      uploadData.file.name = 'id_scan.png'
      uploadData.file.data = req.uploads['id_scan.png'].buffer
    }
    const accountInfo = {
      legal_entity: {}
    }
    try {
      const file = await stripe.files.create(uploadData, req.stripeKey)
      accountInfo.legal_entity.document = file.id
    } catch (error) {
      throw new Error('invalid-upload')
    }
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
}
