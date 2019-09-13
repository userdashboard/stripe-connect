const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')
const euCountries = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE']

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body) {
      throw new Error('invalid-first_name')
    }
    const personFields = ['first_name', 'last_name']
    for (const field of personFields) {
      const posted = `relationship_director_${field}`
      if (!req.body[posted]) {
        throw new Error(`invalid-${posted}`)
      }
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (euCountries.indexOf(stripeAccount.country) === -1) {
      throw new Error('invalid-stripe-account')
    }
    if (req.uploads && req.uploads['relationship_director_verification_document_front']) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_director_verification_document_front'].name,
          data: req.uploads['relationship_director_verification_document_front'].buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.relationship_director_verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_document_front')
      }
    } else {
      throw new Error('invalid-relationship_director_verification_document_front')
    }
    if (req.uploads && req.uploads['relationship_director_verification_document_back']) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_director_verification_document_back'].name,
          data: req.uploads['relationship_director_verification_document_back'].buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.relationship_director_verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_document_back')
      }
    } else {
      throw new Error('invalid-relationship_director_verification_document_back')
    }
    let directors = await global.api.user.connect.CompanyDirectors.get(req)
    directors = directors || []
    const id = await dashboard.UUID.generateID()
    const director = {
      directorid: `director_${id}`,
      object: 'director',
      created: dashboard.Timestamp.now,
      stripeid: req.query.stripeid
    }
    for (const field of personFields) {
      const posted = `relationship_director_${field}`
      director[posted] = req.body[posted]
    }
    directors.unshift(director)
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'directors', directors)
    try {
      const accountNow = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      await dashboard.Storage.write(`${req.appid}/map/directorid/stripeid/${director.directorid}`, req.query.stripeid)
      req.success = true
      return director
    } catch (error) {
      throw new Error('unknown-error')
    }
  }
}
