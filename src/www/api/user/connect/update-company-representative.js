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
    const person = await global.api.user.connect.CompanyRepresentative.get(req)
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
    const companyRepresentativeInfo = {}
    if (global.stripeJS === 3) {
      companyRepresentativeInfo.person_token = req.body.token
    } else {
      for (const field of person.requirements.currently_due) {
        if (field === 'relationship.account_opener.address.line2' ||
            field === 'relationship.account_opener.relationship.title' ||
            field === 'relationship.account_opener.relationship.executive' ||
            field === 'relationship.account_opener.relationship.director' ||
            field === 'relationship.account_opener.relationship.owner') {
          continue
        }
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          if (field !== 'relationship.account_opener.verification.document' &&
              field !== 'relationship.account_opener.verification.additional_document') {
            throw new Error(`invalid-${posted}`)
          }
        }
        for (const field of person.requirements.currently_due) {
          if (field.startsWith('business_profile.')) {
            const property = field.substring('business_profile.'.length)
            companyRepresentativeInfo.business_profile = companyRepresentativeInfo.business_profile || {}
            companyRepresentativeInfo.business_profile[property] = req.body[posted]
            delete (req.body[posted])
          } else if (field.startsWith('address_kanji.')) {
            const property = field.substring('address_kanji.'.length)
            companyRepresentativeInfo.address_kanji = companyRepresentativeInfo.address_kanji || {}
            companyRepresentativeInfo.address_kanji[property] = req.body[posted]
          } else if (field.startsWith('address_kana.')) {
            const property = field.substring('address_kana.'.length)
            companyRepresentativeInfo.address_kana = companyRepresentativeInfo.address_kana || {}
            companyRepresentativeInfo.address_kana[property] = req.body[posted]
          } else if (field.startsWith('address.')) {
            const property = field.substring('address.'.length)
            companyRepresentativeInfo.address[property] = req.body[posted]
          } else if (field.startsWith('verification.document.')) {
            const property = field.substring('verification.document.'.length)
            companyRepresentativeInfo.verification = companyRepresentativeInfo.verification || {}
            companyRepresentativeInfo.verification.document = companyRepresentativeInfo.verification.document || {}
            companyRepresentativeInfo.verification.document[property] = req.body[posted]
          } else if (field.startsWith('verification.additional_document.')) {
            const property = field.substring('verification.additional_document.'.length)
            companyRepresentativeInfo.verification = companyRepresentativeInfo.verification || {}
            companyRepresentativeInfo.verification.additional_document = companyRepresentativeInfo.verification.additional_document || {}
            companyRepresentativeInfo.verification.additional_document[property] = req.body[posted]
          }
        }
        if (req.body.address_line2) {
          companyRepresentativeInfo.address = companyRepresentativeInfo.address || {}
          companyRepresentativeInfo.address.line2 = req.body.address_line2
        }
      }
      for (const field of person.requirements.eventually_due) {
        if (field === 'relationship.account_opener.address.line2' ||
            field === 'relationship.account_opener.relationship.title' ||
            field === 'relationship.account_opener.relationship.executive' ||
            field === 'relationship.account_opener.relationship.director' ||
            field === 'relationship.account_opener.relationship.owner') {
          continue
        }
        if (person.requirements.currently_due.indexOf(field) > -1) {
          continue
        }
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          continue
        }
        for (const field of person.requirements.currently_due) {
          if (field.startsWith('business_profile.')) {
            const property = field.substring('business_profile.'.length)
            companyRepresentativeInfo.business_profile = companyRepresentativeInfo.business_profile || {}
            companyRepresentativeInfo.business_profile[property] = req.body[posted]
            delete (req.body[posted])
          } else if (field.startsWith('address_kanji.')) {
            const property = field.substring('address_kanji.'.length)
            companyRepresentativeInfo.address_kanji = companyRepresentativeInfo.address_kanji || {}
            companyRepresentativeInfo.address_kanji[property] = req.body[posted]
          } else if (field.startsWith('address_kana.')) {
            const property = field.substring('address_kana.'.length)
            companyRepresentativeInfo.address_kana = companyRepresentativeInfo.address_kana || {}
            companyRepresentativeInfo.address_kana[property] = req.body[posted]
          } else if (field.startsWith('address.')) {
            const property = field.substring('address.'.length)
            companyRepresentativeInfo.address[property] = req.body[posted]
          } else if (field.startsWith('verification.document.')) {
            const property = field.substring('verification.document.'.length)
            companyRepresentativeInfo.verification = companyRepresentativeInfo.verification || {}
            companyRepresentativeInfo.verification.document = companyRepresentativeInfo.verification.document || {}
            companyRepresentativeInfo.verification.document[property] = req.body[posted]
          } else if (field.startsWith('verification.additional_document.')) {
            const property = field.substring('verification.additional_document.'.length)
            companyRepresentativeInfo.verification = companyRepresentativeInfo.verification || {}
            companyRepresentativeInfo.verification.additional_document = companyRepresentativeInfo.verification.additional_document || {}
            companyRepresentativeInfo.verification.additional_document[property] = req.body[posted]
          }
        }
      }
    }
    if (req.body.percent_ownership) {
      try {
        const percent = parseFloat(req.body.percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-relationship_percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-relationship_percent_ownership')
      }
      companyRepresentativeInfo.percent_ownership = req.body.percent_ownership
    }
    if (req.body.relationship_title) {
      companyRepresentativeInfo.relationship_title = req.body.relationship_title
    }
    if (req.body.relationship_executive) {
      companyRepresentativeInfo.relationship_executive = true
    }
    while (true) {
      try {
        const companyRepresentativeNow = await stripe.accounts.updatePerson(person.account, person.id, companyRepresentativeInfo, req.stripeKey)
        await stripeCache.update(companyRepresentativeNow)
        return companyRepresentativeNow
      } catch (error) {
        if (error.raw && error.raw.code === 'lock_timeout') {
          continue
        }
        if (error.type === 'StripeConnectionError') {
          continue
        }
        if (error.message.startsWith('invalid-')) {
          throw error
        }
        if (process.env.DEBUG_ERRORS) { console.log(error) } throw new Error('unknown-error')
      }
    }
  }
}
