const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.legal_entity.type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    // validation
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration || !registration.documentid) {
      throw new Error('invalid-documentid')
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec._get(req)
    const requiredFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    const requireOwners = requiredFields.indexOf('legal_entity.additional_owners') > -1
    if (requireOwners && !stripeAccount.metadata.submittedOwners) {
      throw new Error('invalid-additional-owners')
    }
    for (const pathAndField of requiredFields) {
      let field = pathAndField.split('.').pop()
      if (
        field === 'external_account' ||
        field === 'document' ||
        field === 'type' ||
        field === 'additional_owners' ||
        field === 'ip' ||
        field === 'date') {
        continue
      }
      if (stripeAccount.country === 'JP') {
        if (pathAndField.startsWith('legal_entity.address_kana.') ||
          pathAndField.startsWith('legal_entity.personal_address_kana.')) {
          field += '_kana'
        } else if (pathAndField.startsWith('legal_entity.address_kanji.') ||
          pathAndField.startsWith('legal_entity.personal_address_kanji.')) {
          field += '_kanji'
        }
      }
      if (pathAndField.startsWith('legal_entity.personal_address')) {
        field = `personal_${field}`
      } else if (pathAndField.startsWith('legal_entity.address')) {
        field = `company_${field}`
      }
      if (!registration[field]) {
        throw new Error(`invalid-registration`)
      }
    }
    const testInfo = {
      type: 'custom',
      country: stripeAccount.country,
      legal_entity: {
        type: 'company',
        address: {},
        personal_address: {},
        dob: {}
      }
    }
    const accountInfo = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      legal_entity: {
        address: {},
        dob: {},
        verification: {}
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
    }
    let fieldName
    for (const field in registration) {
      switch (field) {
        case 'documentid':
          accountInfo.legal_entity.verification.document = registration[field]
          continue
        case 'first_name':
        case 'last_name':
        case 'business_name':
        case 'gender':
          accountInfo.legal_entity[field] = registration[field]
          continue
        case 'business_tax_id':
        case 'personal_id_number':
        case 'phone_number':
        case 'ssn_last_4':
          testInfo.legal_entity[field] = registration[field]
          accountInfo.legal_entity[field] = registration[field]
          continue
        case 'day':
        case 'month':
        case 'year':
          accountInfo.legal_entity.dob[field] = registration[field]
          continue
        case 'business_name_kana':
        case 'business_name_kanji':
        case 'first_name_kana':
        case 'first_name_kanji':
        case 'last_name_kana':
        case 'last_name_kanji':
          accountInfo.legal_entity[field] = registration[field]
          continue
        case 'company_city':
        case 'company_state':
        case 'company_postal_code':
        case 'company_line1':
          if (stripeAccount.country !== 'JP') {
            fieldName = field.substring('company_'.length)
            accountInfo.legal_entity.address[fieldName] = registration[field]
          }
          continue
        case 'company_city_kana':
        case 'company_town_kana':
        case 'company_state_kana':
        case 'company_line1_kana':
        case 'company_postal_code_kana':
          fieldName = field.substring('company_'.length)
          fieldName = fieldName.substring(0, fieldName.lastIndexOf('_'))
          accountInfo.legal_entity.address_kana = accountInfo.legal_entity.address_kana || {}
          accountInfo.legal_entity.address_kana[fieldName] = registration[field]
          continue
        case 'company_city_kanji':
        case 'company_town_kanji':
        case 'company_state_kanji':
        case 'company_line1_kanji':
        case 'company_postal_code_kanji':
          fieldName = field.substring('company_'.length)
          fieldName = fieldName.substring(0, fieldName.lastIndexOf('_'))
          accountInfo.legal_entity.address_kanji = accountInfo.legal_entity.address_kanji || {}
          accountInfo.legal_entity.address_kanji[fieldName] = registration[field]
          continue
        case 'personal_city':
        case 'personal_state':
        case 'personal_line1':
          if (stripeAccount.country !== 'JP') {
            fieldName = field.substring('personal_'.length)
            accountInfo.legal_entity.personal_address = accountInfo.legal_entity.personal_address || {}
            accountInfo.legal_entity.personal_address[fieldName] = registration[field]
          }
          continue
        case 'personal_postal_code':
          if (stripeAccount.country !== 'JP') {
            fieldName = field.substring('personal_'.length)
            testInfo.legal_entity.personal_address = testInfo.legal_entity.personal_address || {}
            testInfo.legal_entity.personal_address[fieldName] = registration[field]
            accountInfo.legal_entity.personal_address = accountInfo.legal_entity.personal_address || {}
            accountInfo.legal_entity.personal_address[fieldName] = registration[field]
          }
          continue
        case 'personal_city_kana':
        case 'personal_town_kana':
        case 'personal_state_kana':
        case 'personal_line1_kana':
        case 'personal_postal_code_kana':
          fieldName = field.substring('personal_'.length)
          fieldName = fieldName.substring(0, fieldName.lastIndexOf('_'))
          accountInfo.legal_entity.personal_address_kana = accountInfo.legal_entity.personal_address_kana || {}
          accountInfo.legal_entity.personal_address_kana[fieldName] = registration[field]
          continue
        case 'personal_city_kanji':
        case 'personal_town_kanji':
        case 'personal_state_kanji':
        case 'personal_line1_kanji':
        case 'personal_postal_code_kanji':
          fieldName = field.substring('personal_'.length)
          fieldName = fieldName.substring(0, fieldName.lastIndexOf('_'))
          accountInfo.legal_entity.personal_address_kanji = accountInfo.legal_entity.personal_address_kanji || {}
          accountInfo.legal_entity.personal_address_kanji[fieldName] = registration[field]
          continue
      }
    }
    // Some fields are validated by Stripe like postal codes, and
    // when there is an issue other fields become read-only while
    // the identity checks are perfomed and that may take days.
    //
    // A test submission is made to catch those validation errors
    // and allows the registration to be updated prior to submission.
    let temp
    try {
      temp = await stripe.accounts.create(testInfo, req.stripeKey)
      await stripe.accounts.del(temp.id, req.stripeKey)
    } catch (error) {
      if (temp && temp.id) {
        await stripe.accounts.del(temp.id, req.stripeKey)
      }
      const errorMessage = error.param ? error.raw.param : error.message
      if (errorMessage.startsWith('legal_entity[address]')) {
        let field = errorMessage.substring('legal_entity[address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_${field}`)
      } else if (errorMessage.startsWith('legal_entity[personal_address]')) {
        let field = errorMessage.substring('legal_entity[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('legal_entity[address_kana]')) {
        let field = errorMessage.substring('legal_entity[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_${field}_kana`)
      } else if (errorMessage.startsWith('legal_entity[address_kanji]')) {
        let field = errorMessage.substring('legal_entity[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_${field}_kanji`)
      } else if (errorMessage.startsWith('legal_entity')) {
        let field = errorMessage.substring('legal_entity['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      }
      throw new Error('unkonwn-error')
    }
    const accountNow = await stripe.accounts.update(stripeAccount.id, accountInfo, req.stripeKey)
    req.success = true
    await stripeCache.update(accountNow, req.stripeKey)
    return accountNow
  }
}
