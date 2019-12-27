const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const person = await global.api.user.connect.CompanyDirector.get(req)
    if (!person) {
      throw new Error('invalid-personid')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    let validateDOB = false
    if (req.body.dob_day) {
      validateDOB = true
      try {
        const day = parseInt(req.body.dob_day, 10)
        if (!day || day < 1 || day > 31) {
          throw new Error('invalid-dob_day')
        }
        if (day < 10) {
          req.body.dob_day = '0' + day
        }
      } catch (s) {
        throw new Error('invalid-dob_day')
      }
    }
    if (req.body.dob_month) {
      validateDOB = true
      try {
        const month = parseInt(req.body.dob_month, 10)
        if (!month || month < 1 || month > 12) {
          throw new Error('invalid-dob_month')
        }
        if (month < 10) {
          req.body.dob_month = '0' + month
        }
      } catch (s) {
        throw new Error('invalid-dob_month')
      }
    }
    if (req.body.dob_year) {
      validateDOB = true
      try {
        const year = parseInt(req.body.dob_year, 10)
        if (!year || year < 1900 || year > new Date().getFullYear() - 18) {
          throw new Error('invalid-dob_year')
        }
      } catch (s) {
        throw new Error('invalid-dob_year')
      }
    }
    if (validateDOB) {
      if (!req.body.dob_day) {
        throw new Error('invalid-dob_day')
      }
      if (!req.body.dob_month) {
        throw new Error('invalid-dob_month')
      }
      if (!req.body.dob_year) {
        throw new Error('invalid-dob_year')
      }
      try {
        Date.parse(`${req.body.dob_year}/${req.body.dob_month}/${req.body.dob_day}`)
      } catch (error) {
        throw new Error('invalid-dob_day')
      }
    }
    if (req.body.address_country) {
      if (!connect.countryNameIndex[req.body.address_country]) {
        throw new Error('invalid-address_country')
      }
    }
    if (req.body.address_state) {
      if (!req.body.address_country) {
        throw new Error('invalid-address_country')
      }
      const states = connect.countryDivisions[req.body.address_country]
      if (!states || !states.length) {
        throw new Error('invalid-address_state')
      }
      let found = false
      for (const state of states) {
        found = state.value === req.body.address_state
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-address_state')
      }
    }
    if (req.uploads) {
      if (req.uploads.verification_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_document_front.name,
            data: req.uploads.verification_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_document_front = file.id
        } catch (error) {
          throw new Error('invalid-verification_document_front')
        }
      }
      if (req.uploads.verification_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_document_back.name,
            data: req.uploads.verification_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_document_back = file.id
        } catch (error) {
          throw new Error('invalid-verification_document_back')
        }
      }
      if (req.uploads.verification_additional_document_front) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_additional_document_front.name,
            data: req.uploads.verification_additional_document_front.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_additional_document_front = file.id
        } catch (error) {
          throw new Error('invalid-verification_additional_document_front')
        }
      }
      if (req.uploads.verification_additional_document_back) {
        const uploadData = {
          purpose: 'identity_document',
          file: {
            type: 'application/octet-stream',
            name: req.uploads.verification_additional_document_back.name,
            data: req.uploads.verification_additional_document_back.buffer
          }
        }
        try {
          const file = await stripe.files.create(uploadData, req.stripeKey)
          req.body.verification_additional_document_back = file.id
        } catch (error) {
          throw new Error('invalid-verification_additional_document_back')
        }
      }
    }
    const companyDirectorInfo = {}
    if (global.stripeJS === 3) {
      companyDirectorInfo.person_token = req.body.token
    } else {
      for (const field of person.requirements.currently_due) {
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          if (field === 'relationship.account_opener.address.line2' ||
              field === 'relationship.account_opener.relationship.title' ||
              field === 'relationship.account_opener.relationship.executive' ||
              field === 'relationship.account_opener.relationship.director' ||
              field === 'relationship.account_opener.relationship.owner' ||
              (field === 'relationship.account_opener.verification.document.front' && req.body.token) ||
              (field === 'relationship.account_opener.verification.document.back' && req.body.token)) {
            continue
          }
          throw new Error(`invalid-${posted}`)
        }
        for (const field of person.requirements.currently_due) {
          if (field.startsWith('business_profile_')) {
            const property = field.substring('business_profile_'.length)
            companyDirectorInfo.business_profile[property] = req.body[posted]
            delete (req.body[posted])
            continue
          }
          if (field.startsWith('address_kanji_')) {
            const property = field.substring('address_kanji_'.length)
            companyDirectorInfo.address_kanji = companyDirectorInfo.address_kanji || {}
            companyDirectorInfo.address_kanji[property] = req.body[posted]
          } else if (field.startsWith('address_kana_')) {
            const property = field.substring('address_kana_'.length)
            companyDirectorInfo.address_kana = companyDirectorInfo.address_kana || {}
            companyDirectorInfo.address_kana[property] = req.body[posted]
          } else if (field.startsWith('address_')) {
            const property = field.substring('address_'.length)
            companyDirectorInfo.address[property] = req.body[posted]
          } else if (field.startsWith('verification_document_')) {
            const property = field.substring('verification_document_'.length)
            companyDirectorInfo.verification = companyDirectorInfo.verification || {}
            companyDirectorInfo.verification.document = companyDirectorInfo.verification.document || {}
            companyDirectorInfo.verification.document[property] = req.body[posted]
          } else if (field.startsWith('verification_additional_document_')) {
            const property = field.substring('verification_additional_document_'.length)
            companyDirectorInfo.verification = companyDirectorInfo.verification || {}
            companyDirectorInfo.verification.additional_document = companyDirectorInfo.verification.additional_document || {}
            companyDirectorInfo.verification.additional_document[property] = req.body[posted]
          } else {
            const property = field.substring(''.length)
            companyDirectorInfo.company[property] = req.body[posted]
          }
        }
      }
    }
    if (req.body.percent_ownership) {
      try {
        const percent = parseFloat(req.body.percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-percent_ownership')
      }
      companyDirectorInfo.percent_ownership = req.body.percent_ownership
    }
    if (req.body.relationship_title) {
      companyDirectorInfo.relationship_title = req.body.relationship_title
    }
    if (req.body.relationship_executive) {
      companyDirectorInfo.relationship_executive = true
    }
    try {
      const companyDirectorNow = await stripe.accounts.updatePerson(person.account, person.id, companyDirectorInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(companyDirectorNow)
      return companyDirectorNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
