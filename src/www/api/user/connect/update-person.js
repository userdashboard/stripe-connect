const connect = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.personid) {
      throw new Error('invalid-personid')
    }
    const person = await global.api.user.connect.Person.get(req)
    if (!person) {
      throw new Error('invalid-personid')
    }
    if (global.stripeJS === 3 && !req.body.token) {
      throw new Error('invalid-token')
    }
    req.query.stripeid = person.account
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    let requiresInfo = false
    for (const requirement of stripeAccount.requirements.currently_due) {
      requiresInfo = requirement.startsWith(person.id)
      if (requiresInfo) {
        break
      }
    }
    if (!requiresInfo) {
      for (const requirement of stripeAccount.requirements.eventually_due) {
        requiresInfo = requirement.startsWith(person.id)
        if (requiresInfo) {
          break
        }
      }
    }
    if (!requiresInfo) {
      throw new Error('invalid-person')
    }
    const updateInfo = {}
    if (global.stripeJS === 3) {
      updateInfo.person_token = req.body.token
    } else {
      updateInfo.metadata = {
        token: false
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
          const now = new Date().getFullYear()
          if (!year || year < now - 120 || year > now - 18) {
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
      if (req.uploads) {
        if (req.uploads.verification_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_document_front.name,
              data: req.uploads.verification_document_front.buffer
            }
          }
          const front = await stripeCache.execute('files', 'create', frontData, req.stripeKey)
          req.body.verification_document_front = front.id
        }
        if (req.uploads.verification_document_back) {
          const backData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_document_back.name,
              data: req.uploads.verification_document_back.buffer
            }
          }
          const back = await stripeCache.execute('files', 'create', backData, req.stripeKey)
          req.body.verification_document_back = back.id
        }
        if (req.uploads.verification_additional_document_front) {
          const frontData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_front.name,
              data: req.uploads.verification_additional_document_front.buffer
            }
          }
          const front = await stripeCache.execute('files', 'create', frontData, req.stripeKey)
          req.body.verification_document_additional_front = front.id
        }
        if (req.uploads.verification_additional_document_back) {
          const backData = {
            purpose: 'identity_document',
            file: {
              type: 'application/octet-stream',
              name: req.uploads.verification_additional_document_back.name,
              data: req.uploads.verification_additional_document_back.buffer
            }
          }
          const back = await stripeCache.execute('files', 'create', backData, req.stripeKey)
          req.body.verification_additional_document_back = back.id
        }
      }
      for (const fullField of stripeAccount.requirements.currently_due) {
        if (!fullField.startsWith(person.id)) {
          continue
        }
        const field = fullField.substring(`${person.id}.`.length)
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          if (field === 'address.line2' ||
              field === 'verification.document' ||
              field === 'verification.additional_document') {
            continue
          }
          throw new Error(`invalid-${posted}`)
        }
        if (field.startsWith('dob.')) {
          const property = field.substring('dob.'.length)
          updateInfo.dob = updateInfo.dob || {}
          updateInfo.dob[property] = req.body[posted]
        } else if (field.startsWith('address_kanji.')) {
          const property = field.substring('address_kanji.'.length)
          updateInfo.address_kanji = updateInfo.address_kanji || {}
          updateInfo.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('address_kana.')) {
          const property = field.substring('address_kana.'.length)
          updateInfo.address_kana = updateInfo.address_kana || {}
          updateInfo.address_kana[property] = req.body[posted]
        } else if (field.startsWith('address.')) {
          const property = field.substring('address.'.length)
          updateInfo.address = updateInfo.address || {}
          updateInfo.address[property] = req.body[posted]
        } else if (field.startsWith('verification.document.')) {
          const property = field.substring('verification.document'.length)
          updateInfo.verification = updateInfo.verification || {}
          updateInfo.verification.document = updateInfo.verification.document || {}
          updateInfo.verification.document[property] = req.body[posted]
        } else if (field.startsWith('verification.additional_document.')) {
          const property = field.substring('verification.additional_document'.length)
          updateInfo.verification = updateInfo.verification || {}
          updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
          updateInfo.verification.additional_document[property] = req.body[posted]
        } else {
          updateInfo[field] = req.body[posted]
        }
      }
      for (const fullField of stripeAccount.requirements.eventually_due) {
        if (!fullField.startsWith(person.id)) {
          continue
        }
        const field = fullField.substring(`${person.id}.`.length)
        if (stripeAccount.requirements.currently_due.indexOf(field) > -1) {
          continue
        }
        const posted = field.split('.').join('_')
        if (!req.body[posted]) {
          continue
        }
        if (field.startsWith('dob.')) {
          const property = field.substring('dob.'.length)
          updateInfo.dob = updateInfo.dob || {}
          updateInfo.dob[property] = req.body[posted]
        } else if (field.startsWith('address_kanji.')) {
          const property = field.substring('address_kanji.'.length)
          updateInfo.address_kanji = updateInfo.address_kanji || {}
          updateInfo.address_kanji[property] = req.body[posted]
        } else if (field.startsWith('address_kana.')) {
          const property = field.substring('address_kana.'.length)
          updateInfo.address_kana = updateInfo.address_kana || {}
          updateInfo.address_kana[property] = req.body[posted]
        } else if (field.startsWith('address.')) {
          const property = field.substring('address.'.length)
          updateInfo.address = updateInfo.address || {}
          updateInfo.address[property] = req.body[posted]
        } else if (field.startsWith('verification.document.')) {
          const property = field.substring('verification.document'.length)
          updateInfo.verification = updateInfo.verification || {}
          updateInfo.verification.document = updateInfo.verification.document || {}
          updateInfo.verification.document[property] = req.body[posted]
        } else if (field.startsWith('verification.additional_document.')) {
          const property = field.substring('verification.additional_document'.length)
          updateInfo.verification = updateInfo.verification || {}
          updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
          updateInfo.verification.additional_document[property] = req.body[posted]
        } else {
          updateInfo[field] = req.body[posted]
        }
      }
      // TODO: these fields are optional but not represented in requirements
      // so when Stripe updates to have something like an 'optionally_due' array
      // the manual checks can be removed
      if (req.body.relationship_title) {
        updateInfo.relationship = updateInfo.relationship || {}
        updateInfo.relationship.title = req.body.relationship_title
      }
      if (req.body.relationship_executive) {
        updateInfo.relationship = updateInfo.relationship || {}
        updateInfo.relationship.executive = true
      }
      if (req.body.relationship_director) {
        updateInfo.relationship = updateInfo.relationship || {}
        updateInfo.relationship.director = true
      }
      if (req.body.relationship_owner) {
        updateInfo.relationship = updateInfo.relationship || {}
        updateInfo.relationship.owner = true
      }
      if (req.body.relationship_percent_ownership) {
        try {
          const percent = parseFloat(req.body.relationship_percent_ownership, 10)
          if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
            throw new Error('invalid-relationship_percent_ownership')
          }
        } catch (s) {
          throw new Error('invalid-relationship_percent_ownership')
        }
        updateInfo.relationship = updateInfo.relationship || {}
        updateInfo.relationship.percent_ownership = req.body.relationship_percent_ownership
      }
      if (req.body.address_line2) {
        updateInfo.address = updateInfo.address || {}
        updateInfo.address.line2 = req.body.address_line2
      }
      if (req.body.address_country && req.body.address_country.length) {
        if (!connect.countryNameIndex[req.body.address_country]) {
          throw new Error('invalid-address_country')
        }
        updateInfo.address = updateInfo.address || {}
        updateInfo.address.country = req.body.address_country
      }
      if (req.body.address_state && req.body.address_state.length) {
        const states = connect.countryDivisions[req.body.address_country || stripeAccount.country]
        let found
        for (const state of states) {
          found = state.value === req.body.address_state
          if (found) {
            break
          }
        }
        if (!found) {
          throw new Error('invalid-address_state')
        }
        updateInfo.address = updateInfo.address || {}
        updateInfo.address.state = req.body.address_state
      }
      if (req.body.address_postal_code) {
        updateInfo.address = updateInfo.address || {}
        updateInfo.address.postal_code = req.body.address_postal_code
      }
      // TODO: not sure what a valid id number constraint would be
      if (req.body.id_number && req.body.id_number.length < 5) {
        throw new Error('invalid-id_number')
      }
      if (req.body.ssn_last_4 && req.body.ssn_last_4.length !== 4) {
        throw new Error('invalid-ssn_last_4')
      }
      if (req.body.verification_document_back) {
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.document = updateInfo.verification.document || {}
        updateInfo.verification.document.back = req.body.verification_document_back
      }
      if (req.body.verification_document_front) {
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.document = updateInfo.verification.document || {}
        updateInfo.verification.document.front = req.body.verification_document_front
      }
      if (req.body.verification_additional_document_back) {
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
        updateInfo.verification.additional_document.back = req.body.verification_additional_document_back
      }
      if (req.body.verification_additional_document_front) {
        updateInfo.verification = updateInfo.verification || {}
        updateInfo.verification.additional_document = updateInfo.verification.additional_document || {}
        updateInfo.verification.additional_document.front = req.body.verification_additional_document_front
      }
    }
    const personNow = await stripeCache.execute('accounts', 'updatePerson', person.account, person.id, updateInfo, req.stripeKey)
    await stripeCache.delete(person.id)
    return personNow
  }
}
