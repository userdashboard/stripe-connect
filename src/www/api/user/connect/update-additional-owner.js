const connect = require('../../../../../index.js')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.ownerid) {
      throw new Error('invalid-ownerid')
    }
    if (!req.body || !req.body.city) {
      throw new Error('invalid-city')
    }
    if (!req.body.country) {
      throw new Error('invalid-country')
    }
    if (!req.body.line1) {
      throw new Error('invalid-line1')
    }
    if (!req.body.postal_code) {
      throw new Error('invalid-postal_code')
    }
    if (!req.body.day) {
      throw new Error('invalid-day')
    }
    if (!req.body.month) {
      throw new Error('invalid-month')
    }
    if (!req.body.year) {
      throw new Error('invalid-year')
    }
    if (!req.body.first_name) {
      throw new Error('invalid-first_name')
    }
    if (!req.body.last_name) {
      throw new Error('invalid-last_name')
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
        req.body.documentid = file.id
      } catch (error) {
        throw new Error('invalid-upload')
      }
    }
    const owner = await global.api.user.connect.AdditionalOwner._get(req)
    req.query.stripeid = owner.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted || stripeAccount.metadata.submittedOwners) {
      throw new Error('invalid-stripe-account')
    }
    const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
    for (const field in req.body) {
      owner[field] = req.body[field]
    }
    if (owners && owners.length) {
      for (const i in owners) {
        if (owners[i].ownerid === req.query.ownerid) {
          owners[i] = owner
          break
        }
      }
    } else {
      owners = [owner]
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', owners)
    try {
      const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      req.success = true
      return owner
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
