const connect = require('../../../../../index.js')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
stripe.setMaxNetworkRetries(global.maximumStripeRetries)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (!req.body || !req.body.personid) {
      throw new Error('invalid-personid')
    }
    const person = await stripeCache.retrievePerson(req.query.stripeid, req.body.personid, req.stripeKey)
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
    if (req.body.percent_ownership) {
      try {
        const percent = parseFloat(req.body.percent_ownership, 10)
        if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
          throw new Error('invalid-percent_ownership')
        }
      } catch (s) {
        throw new Error('invalid-percent_ownership')
      }
    }
    const requiredFields = stripeAccount.requirements.currently_due
    const personInfo = {}
    for (const field of requiredFields) {
      const posted = field.split('.').join('_')
      if (!req.body[posted]) {
        continue
      }
      if (field.startsWith(`${person.id}.address_kanji_`)) {
        const property = field.substring(`${person.id}.address_kanji_`.length)
        personInfo.address_kanji = personInfo.address_kanji || {}
        personInfo.address_kanji[property] = req.body[posted]
      } else if (field.startsWith(`${person.id}.address_kana_`)) {
        const property = field.substring(`${person.id}.address_kana_`.length)
        personInfo.address_kana = personInfo.address_kana || {}
        personInfo.address_kana[property] = req.body[posted]
      } else if (field.startsWith(`${person.id}.address_`)) {
        const property = field.substring(`${person.id}.address_`.length)
        personInfo.address = personInfo.address || {}
        personInfo.address[property] = req.body[posted]
      } else if (field.startsWith(`${person.id}.verification_document_`)) {
        const property = field.substring(`${person.id}.verification_document_`.length)
        personInfo.verification = personInfo.verification || {}
        personInfo.verification.document = personInfo.verification.document || {}
        personInfo.verification.document[property] = req.body[posted]
      } else if (field.startsWith(`${person.id}.verification_additional_document_`)) {
        const property = field.substring(`${person.id}.verification_additional_document_`.length)
        personInfo.verification = personInfo.verification || {}
        personInfo.verification.additional_document = personInfo.verification.additional_document || {}
        personInfo.verification.additional_document[property] = req.body[posted]
      } else if (field.startsWith(`${person.id}.dob_`)) {
        const property = field.substring(`${person.id}.dob_`.length)
        personInfo.dob = personInfo.dob || {}
        personInfo.dob[property] = req.body[posted]
      } else if (field === `${person.id}.relationship_title`) {
        personInfo.relationship.title = req.body[posted]
      } else {
        const property = field.substring(`${person.id}.`.length)
        if (property !== 'relationship_title' &&
            property !== 'relationship_executive' &&
            property !== 'percent_ownership' &&
            property !== 'relationship_director') {
          personInfo[property] = req.body[posted]
        }
      }
    }
    if (global.stripeJS === 3) {
      personInfo.token = req.body.token
    }
    try {
      const personNow = await stripe.accounts.updatePerson(req.query.stripeid, req.body.personid, personInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(personNow)
      return personNow
    } catch (error) {
      if (error.message.startsWith('invalid-')) {
        throw error
      }
      throw new Error('unknown-error')
    }
  }
}
