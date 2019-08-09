const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.legal_entity.type !== 'individual' ||
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
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    const requiredFields = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
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
        if (pathAndField.startsWith('legal_entity.address_kana.')) {
          field += '_kana'
        } else if (pathAndField.startsWith('legal_entity.address_kanji.')) {
          field += '_kanji'
        }
      }
      if (!registration[field]) {
        throw new Error(`invalid-registration`)
      }
    }
    const testInfo = {
      type: 'custom',
      country: stripeAccount.country,
      legal_entity: {
        type: 'individual',
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
        case 'personal_id_number':
        case 'gender':
        case 'phone_number':
        case 'ssn_last_4':
          testInfo.legal_entity[field] = registration[field]
          accountInfo.legal_entity[field] = registration[field]
          continue
        case 'day':
        case 'month':
        case 'year':
          testInfo.legal_entity.dob[field] = registration[field]
          accountInfo.legal_entity.dob[field] = registration[field]
          continue
        case 'first_name_kana':
        case 'first_name_kanji':
        case 'last_name_kana':
        case 'last_name_kanji':
          testInfo.legal_entity[field] = registration[field]
          accountInfo.legal_entity[field] = registration[field]
          continue
        case 'city':
        case 'state':
        case 'postal_code':
        case 'line1':
          if (stripeAccount.country !== 'JP') {
            testInfo.legal_entity.address[field] = registration[field]
            accountInfo.legal_entity.address[field] = registration[field]
          }
          continue
        case 'city_kana':
        case 'town_kana':
        case 'state_kana':
        case 'line1_kana':
        case 'postal_code_kana':
          fieldName = field.substring(0, field.lastIndexOf('_'))
          testInfo.legal_entity.address_kana = testInfo.legal_entity.address_kana || {}
          testInfo.legal_entity.address_kana[fieldName] = registration[field]
          accountInfo.legal_entity.address_kana = accountInfo.legal_entity.address_kana || {}
          accountInfo.legal_entity.address_kana[fieldName] = registration[field]
          continue
        case 'city_kanji':
        case 'town_kanji':
        case 'state_kanji':
        case 'line1_kanji':
        case 'postal_code_kanji':
          fieldName = field.substring(0, field.lastIndexOf('_'))
          testInfo.legal_entity.address_kanji = testInfo.legal_entity.address_kanji || {}
          testInfo.legal_entity.address_kanji[fieldName] = registration[field]
          accountInfo.legal_entity.address_kanji = accountInfo.legal_entity.address_kanji || {}
          accountInfo.legal_entity.address_kanji[fieldName] = registration[field]
          continue
      }
    }
    // try and create an account with this data and see if it errors
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
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('legal_entity[personal_address]')) {
        let field = errorMessage.substring('legal_entity[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('legal_entity[address_kana]')) {
        let field = errorMessage.substring('legal_entity[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kana`)
      } else if (errorMessage.startsWith('legal_entity[address_kanji]')) {
        let field = errorMessage.substring('legal_entity[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}_kanji`)
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
