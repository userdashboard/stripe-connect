const connect = require('../../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
const stripeCache = require('../../../../stripe-cache.js')
const euCountries = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE']

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    let stripeAccount = await global.api.user.connect.StripeAccount.get(req)
    if (stripeAccount.metadata.submitted ||
      stripeAccount.business_type !== 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.external_accounts.data.length) {
      throw new Error('invalid-payment-details')
    }
    const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration')
    if (!registration) {
      throw new Error('invalid-registration')
    }
    req.query.country = stripeAccount.country
    const countrySpec = await global.api.user.connect.CountrySpec.get(req)
    const requiredFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
    for (const field of requiredFields) {
      if (field === 'business_type' ||
        field === 'external_account' ||
        field === 'relationship.account_opener' ||
        field === 'relationship.owner' ||
        field === 'tos_acceptance.date' ||
        field === 'relationship.director' ||
        field === 'tos_acceptance.ip') {
        continue
      }
      const posted = field.split('.').join('_')
      if (!registration[posted]) {
        throw new Error(`invalid-registration`)
      }
    }
    const accountInfo = {
      metadata: {
        submitted: dashboard.Timestamp.now
      },
      business_profile: {},
      company: {
        address: {},
        owners_provided: true
      },
      tos_acceptance: {
        ip: req.ip,
        user_agent: req.userAgent,
        date: dashboard.Timestamp.now
      }
    }
    if (euCountries.indexOf(stripeAccount.country)) {
      accountInfo.company.directors_provided = true
    }
    const accountOpener = {
      relationship: {
        account_opener: true,
        owner: true,
        title: 'Account opener'
      },
      verification: {
        document: {}
      },
      address: {},
      dob: {}
    }
    for (const field in registration) {
      if(field.startsWith('business_profile_')) {
        const property = field.substring('business_profile_'.length)
        accountInfo.business_profile[property] = registration[field]
        continue
      }
      if (field.startsWith('company_')) {
        if (field.startsWith('company_address_kanji_')) {
          const property = field.substring('company_address_kanji_'.length)
          accountInfo.company.address_kanji = accountInfo.company.address_kanji || {}
          accountInfo.company.address_kanji[property] = registration[field]
        } else if (field.startsWith('company_address_kana_')) {
          const property = field.substring('company_address_kana_'.length)
          accountInfo.company.address_kana = accountInfo.company.address_kana || {}
          accountInfo.company.address_kana[property] = registration[field]
        } else if (field.startsWith('company_address_')) {
          const property = field.substring('company_address_'.length)
          accountInfo.company.address[property] = registration[field]
        } else if (field.startsWith('company_business_name_')) {
          let property = field.substring('company_business_name_'.length)
          accountInfo.company[`name_${property}`] = registration[field]
        } else {
          const property = field.substring('company_'.length)
          accountInfo.company[property] = registration[field]
        }
        continue
      } 
      if (field.startsWith('relationship_account_opener_')) {
        if (field.startsWith('relationship_account_opener_address_kanji_')) {
          const property = field.substring('relationship_account_opener_address_kanji_'.length)
          accountOpener.address_kanji = accountOpener.address_kanji || {}
          accountOpener.address_kanji[property] = registration[field]
        } else if (field.startsWith('relationship_account_opener_address_kana_')) {
          const property = field.substring('relationship_account_opener_address_kana_'.length)
          accountOpener.address_kana = accountOpener.address_kana || {}
          accountOpener.address_kana[property] = registration[field]
        } else if (field.startsWith('relationship_account_opener_address_')) {
          const property = field.substring('relationship_account_opener_address_'.length)
          accountOpener.address[property] = registration[field]
        } else if (field.startsWith('relationship_account_opener_verification_document_')) {
          const property = field.substring('relationship_account_opener_verification_document_'.length)
          accountOpener.verification.document[property] = registration[field]
        } else if(field.startsWith('relationship_account_opener_dob_')) {
          const property = field.substring('relationship_account_opener_dob_'.length)
          accountOpener.dob[property] = registration[field]
        } else {
          const property = field.substring('relationship_account_opener_'.length)
          accountOpener[property] = registration[field]
        }
      }
    }    
    try {
      await stripe.accounts.createPerson(req.query.stripeid, accountOpener, req.stripeKey)
      const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
      if (owners && owners.length) {
        for (const owner of owners) {
          const ownerInfo = {
            first_name: owner.relationship_owner_first_name,
            last_name: owner.relationship_owner_last_name,
            address: {
              country: owner.relationship_owner_address_country,
              city: owner.relationship_owner_address_city,
              line1: owner.relationship_owner_address_line1,
              postal_code: owner.relationship_owner_address_postal_code
            },            
            dob: {
              day: owner.relationship_owner_dob_day,
              month: owner.relationship_owner_dob_month,
              year: owner.relationship_owner_dob_year
            },
            relationship: {
              owner: true
            },
            verification: {
              document: {
                front: owner.relationship_owner_verification_document_front,
                back: owner.relationship_owner_verification_document_back
              }
            },
          }
          await stripe.accounts.createPerson(req.query.stripeid, ownerInfo, req.stripeKey)
        }
      }
      const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
      if (directors && directors.length) {
        for (const director of directors) {
          const directorInfo = {
            first_name: director.relationship_director_first_name,
            last_name: director.relationship_director_last_name,
            relationship: {
              director: true
            },
            verification: {
              document: {
                front: director.relationship_director_verification_document_front,
                back: director.relationship_director_verification_document_back
              }
            },
          }
          await stripe.accounts.createPerson(req.query.stripeid, directorInfo, req.stripeKey)
        }
      }
      stripeAccount = await stripe.accounts.update(req.query.stripeid, accountInfo, req.stripeKey)
      req.success = true
      await stripeCache.update(stripeAccount, req.stripeKey)
      return stripeAccount
    } catch (error) {
      const errorMessage = error.param ? error.raw.param : error.message
      if (errorMessage.startsWith('company[address]')) {
        let field = errorMessage.substring('company[address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}`)
      } else if (errorMessage.startsWith('company[personal_address]')) {
        let field = errorMessage.substring('company[personal_address]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      } else if (errorMessage.startsWith('company[address_kana]')) {
        let field = errorMessage.substring('company[address_kana]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}_kana`)
      } else if (errorMessage.startsWith('company[address_kanji]')) {
        let field = errorMessage.substring('company[address_kanji]['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-company_address_${field}_kanji`)
      } else if (errorMessage.startsWith('company')) {
        let field = errorMessage.substring('company['.length)
        field = field.substring(0, field.length - 1)
        throw new Error(`invalid-${field}`)
      }
      console.log(error)
      throw new Error('unknown-error')
    }
  }
}
