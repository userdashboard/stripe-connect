const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.directorid) {
      throw new Error('invalid-directorid')
    }
    if (!req.body) {
      throw new Error('relationship_director_first_name')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const director = await global.api.user.connect.CompanyDirector.get(req)
    req.query.stripeid = director.stripeid
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted) {
      throw new Error('invalid-stripe-account')
    }
    if (!req.body.relationship_director_first_name) {
      throw new Error('invalid-relationship_director_first_name')
    }
    if (!req.body.relationship_director_last_name) {
      throw new Error('invalid-relationship_director_last_name')
    }
    let validateDOB = false
    if (req.body.relationship_director_dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.relationship_director_dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-relationship_director_dob_day')
        }
        if (day < 10) {
          req.body.relationship_director_dob_day = '0' + day
        }
      } catch (s) {
        throw new Error('invalid-relationship_director_dob_day')
      }
    }
    if (req.body.relationship_director_dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.relationship_director_dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-relationship_director_dob_month')
        }
        if (month < 10) {
          req.body.relationship_director_dob_month = '0' + month
        }
      } catch (s) {
        throw new Error('invalid-relationship_director_dob_month')
      }
    }
    if (req.body.relationship_director_dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.relationship_director_dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-relationship_director_dob_year111')
        }
      } catch (s) {
        throw new Error('invalid-relationship_director_dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.relationship_director_dob_day) {
        throw new Error('invalid-relationship_director_dob_day')
      }
      if (!req.body.relationship_director_dob_month) {
        throw new Error('invalid-relationship_director_dob_month')
      }
      if (!req.body.relationship_director_dob_year) {
        throw new Error('invalid-relationship_director_dob_year')
      }
      try {
        Date.parse(`${req.body.relationship_director_dob_year}/${req.body.relationship_director_dob_month}/${req.body.relationship_director_dob_day}`)
      } catch (error) {
        throw new Error('invalid-relationship_director_dob_day')
      }
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    if (req.uploads && req.uploads.relationship_director_verification_document_front) {
      const frontData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_director_verification_document_front.name,
          data: req.uploads.relationship_director_verification_document_front.buffer
        }
      }
      try {
        const front = await stripe.files.create(frontData, req.stripeKey)
        req.body.relationship_director_verification_document_front = front.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_document_front')
      }
    }
    if (req.uploads && req.uploads.relationship_director_verification_document_back) {
      const backData = {
        purpose: 'identity_document',
        file: {
          type: 'application/octet-stream',
          name: req.uploads.relationship_director_verification_document_back.name,
          data: req.uploads.relationship_director_verification_document_back.buffer
        }
      }
      try {
        const back = await stripe.files.create(backData, req.stripeKey)
        req.body.relationship_director_verification_document_back = back.id
      } catch (error) {
        throw new Error('invalid-relationship_director_verification_document_back')
      }
    }
    const requiredFields = connect.kycRequirements[stripeAccount.country].companyDirector
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        if (field === 'relationship.director.verification.document.front' ||
            field === 'relationship.director.verification.document.back') {
          continue
        }
        throw new Error(`invalid-${posted}`)
      }
      director[posted] = req.body[posted]
    }
    if (global.stripeJS === 3 && req.body.token) {
      director.token = req.body.token
    }
    if (req.body.relationship_director_executive) {
      director.relationship_director_executive = true
    }
    director.relationship_owner_director = true
    if (global.stripeJS === 3) {
      director.token = req.body.token
    }
    let directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
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
      await stripeCache.update(accountNow)
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
