const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.directorid) {
      throw new Error('invalid-directorid')
    }
    if (!req.body.relationship_director_first_name) {
      throw new Error('invalid-relationship_director_first_name')
    }
    if (!req.body.relationship_director_last_name) {
      throw new Error('invalid-relationship_director_last_name')
    }
    if (req.uploads && req.uploads['relationship_director_verification_documentation_front']) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_director_verification_documentation_front'].name,
          data: req.uploads['relationship_director_verification_documentation_front'].buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.relationship_director_verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_documentation_front')
      }
    }
    if (req.uploads && req.uploads['relationship_director_verification_documentation_back']) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads['relationship_director_verification_documentation_back'].name,
          data: req.uploads['relationship_director_verification_documentation_back'].buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.relationship_director_verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_documentation_back')
      }
    }
    const director = await global.api.user.connect.CompanyDirector.get(req)
    req.query.stripeid = director.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
    for (const field in req.body) {
      director[field] = req.body[field]
    }
    if (directors && directors.length) {
      for (const i in directors) {
        if (directors[i].directorid === req.query.directorid) {
          directors[i] = director
          break
        }
      }
    } else {
      directors = [director]
    }
    const accountInfo = {
      metadata: {
      }
    }
    connect.MetaData.store(accountInfo.metadata, 'directors', directors)
    try {
      const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
      await stripeCache.update(accountNow, req.stripeKey)
      req.success = true
      return director
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
