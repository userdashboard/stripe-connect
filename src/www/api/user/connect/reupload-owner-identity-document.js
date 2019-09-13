const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    const stripeAccounts = await global.api.user.connect.StripeAccounts.get(req)
    if (!stripeAccounts || !stripeAccounts.length) {
      throw new Error('invalid-ownerid')
    }
    let owner
    for (const stripeAccount of stripeAccounts) {
      if (!stripeAccount.metadata.submitted ||
        stripeAccount.business_type === 'individual') {
        continue
      }
      let ownerIndex = -1
      for (const i in stripeAccount.legal_entity.additional_owners) {
        const owner = stripeAccount.legal_entity.additional_owners[i]
        if (!owner.requirements.details_code) {
          continue
        }
        ownerIndex = i
        break
      }
      if (ownerIndex === -1) {
        throw new Error('invalid-stripe-account')
      }
      const owners = await global.api.user.connect.BeneficialOwners.get(req)
      if (owners && owners.length) {
        for (const i in owners) {
          if (owners[i].ownerid !== req.query.ownerid) {
            continue
          }
          owner = owners[i]
          break
        }
      }
      if (owner) {
        break
      }
    }
    if (!owner) {
      throw new Error('invalid-ownerid')
    }
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
