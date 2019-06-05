const stripe = require('stripe')()

module.exports = {
  lock: true,
  before: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    const stripeAccounts = await global.api.user.connect.StripeAccounts._get(req)
    if (!stripeAccounts || !stripeAccounts.length) {
      throw new Error('invalid-ownerid')
    }
    for (const stripeAccount of stripeAccounts) {
      if (!stripeAccount.metadata.submitted ||
          !stripeAccount.metadata.submittedOwners ||
          stripeAccount.legal_entity.type === 'individual') {
        continue
      }
      // find an owner that needs reuploading
      let ownerIndex = -1
      for (const i in stripeAccount.legal_entity.additional_owners) {
        const owner = stripeAccount.legal_entity.additional_owners[i]
        if (!owner.verification.details_code) {
          continue
        }
        ownerIndex = i
        break
      }
      if (ownerIndex === -1) {
        throw new Error('invalid-stripe-account')
      }
      // verify the registration information ownerid
      const owners = await global.api.user.connect.AdditionalOwners._get(req)
      if (owners && owners.length) {
        for (const i in owners) {
          if (owners[i].ownerid !== req.query.ownerid) {
            continue
          }
          req.stripeAccount = stripeAccount
          req.body = req.body || {}
          req.body.index = ownerIndex
          return
        }
      }
    }
    throw new Error('invalid-ownerid')
  },
  patch: async (req) => {
    const accountInfo = {
      legal_entity: {
        additional_owners: {
        }
      }
    }
    if (req.uploads && (req.uploads['id_scan.jpg'] || req.uploads['id_scan.png'])) {
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
      try {
        const file = await stripe.files.create(uploadData, req.stripeKey)
        accountInfo.legal_entity.additional_owners[req.body.index] = {
          document: file.id
        }
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    try {
      const accountNow = await stripe.accounts.update(req.stripeAccount.id, accountInfo, req.stripeKey)
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
