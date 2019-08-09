const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
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
    if (req.body.documentid) {
      return
    }
    const uploadData = {
      purpose: 'identity_document',
      file: {
        type: 'application/octet-stream'
      }
    }
    if (req.uploads && req.uploads['id_scan.jpg']) {
      uploadData.file.name = 'id_scan.jpg'
      uploadData.file.data = req.uploads['id_scan.jpg'].buffer
    } else if (req.uploads && req.uploads['id_scan.png']) {
      uploadData.file.name = 'id_scan.png'
      uploadData.file.data = req.uploads['id_scan.png'].buffer
    }
    try {
      const file = await stripe.files.create(uploadData, req.stripeKey)
      req.body.documentid = file.id
    } catch (error) {
      throw new Error('invalid-upload')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.legal_entity.type === 'individual' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
      countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
      throw new Error('invalid-stripe-account')
    }
    let owners = await global.api.user.connect.AdditionalOwners.get(req)
    owners = owners || []
    if (owners.length === 4) {
      throw new Error('maximum-owners')
    }
    const id = await dashboard.UUID.generateID()
    const owner = {
      object: 'owner'
    }
    for (const field in req.body) {
      owner[field] = req.body[field]
    }
    owner.ownerid = `owner_${id}`
    owner.created = dashboard.Timestamp.now
    owner.ip = req.ip
    owner.userAgent = req.userAgent
    owner.stripeid = req.query.stripeid
    owners.unshift(owner)
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'owners', owners)
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      await dashboard.Storage.write(`${req.appid}/map/ownerid/stripeid/${owner.ownerid}`, req.query.stripeid)
      req.success = true
      return owner
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
