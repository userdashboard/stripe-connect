const connect = require('../../../../index.js')
const countries = require('../../../../countries.json')
const countriesDivisions = require('../../../../countries-divisions.json')
const dashboard = require('@userappstore/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.legal_entity.type === 'individual' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.submittedOwners) {
    throw new Error('invalid-stripe-account')
  }
  const countrySpecs = await global.api.user.connect.CountrySpecs._get(req)
  let applicationCountry, personalAddressCountry, companyAddressCountry
  for (const countrySpec of countrySpecs) {
    if (countrySpec.id === stripeAccount.country) {
      applicationCountry = countrySpec
      break
    }
  }
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (req.body) {
    for (const countryItem of countriesDivisions) {
      if (countryItem.code === req.body.personal_country) {
        personalAddressCountry = countryItem
      }
      if (countryItem.code === req.body.company_country) {
        companyAddressCountry = countryItem
      }
      if (companyAddressCountry && personalAddressCountry) {
        break
      }
    }
  }
  if (!personalAddressCountry) {
    if (req.body && req.body.personal_country) {
      req.error = 'invalid-personal_country'
      return
    }
    for (const countryItem of countriesDivisions) {
      if (countryItem.code === stripeAccount.country) {
        personalAddressCountry = countryItem
        break
      }
    }
  }
  if (!companyAddressCountry) {
    if (req.body && req.body.company_country) {
      req.error = 'invalid-company_country'
      return
    }
    for (const countryItem of countriesDivisions) {
      if (countryItem.code === stripeAccount.country) {
        companyAddressCountry = countryItem
        break
      }
    }
  }
  let countrySpec
  for (const spec of countrySpecs) {
    if (spec.id === stripeAccount.country) {
      countrySpec = spec
      break
    }
  }
  const fieldsNeeded = applicationCountry.verification_fields.company.minimum.concat(applicationCountry.verification_fields.company.additional)
  req.data = { stripeAccount, countries, countrySpec, countrySpecs, applicationCountry, personalAddressCountry, companyAddressCountry, registration, fieldsNeeded }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3F')}`
  }
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'personal_country')
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'company_country')
  if (req.data.personalAddressCountry) {
    const states = formatStateData(req.data.personalAddressCountry.divisions)
    dashboard.HTML.setSelectedOptionByValue(doc, 'personal_country', req.data.personalAddressCountry.code)
    dashboard.HTML.renderList(doc, states, 'state-option', 'personal_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'personal_state', req.data.personalAddressCountry.code)
  }
  if (req.data.companyAddressCountry) {
    const states = formatStateData(req.data.companyAddressCountry.divisions)
    dashboard.HTML.setSelectedOptionByValue(doc, 'company_country', req.data.companyAddressCountry.code)
    dashboard.HTML.renderList(doc, states, 'state-option', 'company_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'company_state', req.data.personalAddressCountry.code)
  }
  const removeElements = []
  if (req.data.applicationCountry.id === 'JP') {
    removeElements.push(
      'company-address-container',
      'personal-information-container',
      'personal-address-container'
    )
  } else {
    removeElements.push(
      'kana-company-information-container',
      'kanji-company-information-container',
      'kana-company-address-container',
      'kanji-company-address-container',
      'kana-personal-information-container',
      'kanji-personal-information-container',
      'kana-personal-address-container',
      'kanji-personal-address-container'
    )
  }
  // remove unrequired fields
  const removableFields = [
    'legal_entity.business_name',
    'legal_entity.business_tax_id',
    'legal_entity.tax_registrar',
    'legal_entity.email',
    'legal_entity.phone_number',
    'legal_entity.gender',
    'legal_entity.personal_id_number',
    'legal_entity.ssn_last_4',
    'legal_entity.address.line1',
    'legal_entity.address.line2',
    'legal_entity.address.city',
    'legal_entity.address.state',
    'legal_entity.address.postal_code',
    'legal_entity.personal_address.line1',
    'legal_entity.personal_address.line2',
    'legal_entity.personal_address.city',
    'legal_entity.personal_address.state',
    'legal_entity.personal_address.postal_code',
    'legal_entity.personal_address.country',
    'legal_entity.dob.day',
    'legal_entity.dob.month',
    'legal_entity.dob.year'
  ]
  for (const field of req.data.fieldsNeeded) {
    const index = removableFields.indexOf(field)
    if (index === -1) {
      continue
    }
    removableFields.splice(index, 1)
  }

  for (const field of removableFields) {
    const parts = field.split('.')
    const name = parts[parts.length - 1]
    switch (field) {
      case 'day':
      // case 'month':
      // case 'year':
        removeElements.push(`dob-container`)
        continue
      case 'legal_entity.business_name':
      case 'legal_entity.business_tax_id':
      case 'legal_entity.tax_registrar':
      case 'legal_entity.email':
      case 'legal_entity.phone_number':
      case 'legal_entity.gender':
      case 'legal_entity.personal_id_number':
      case 'legal_entity.ssn_last_4':
        removeElements.push(`${name}-container`)
        continue
      default:
        if (parts[1] === 'personal_address') {
          removeElements.push(`personal_${name}-container`)
        } else {
          removeElements.push(`company_${name}-container`)
        }
        continue
    }
  }
  if (req.data.registration.document) {
    removeElements.push('first-upload-container')
  } else {
    removeElements.push('replace-upload-container')
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    if (!element) {
      continue
    }
    element.parentNode.removeChild(element)
  }
  const noPersonalAddress = doc.getElementById('personal_line1') === null &&
    doc.getElementById('personal_line2') === null &&
    doc.getElementById('personal_city') === null &&
    doc.getElementById('personal_state') === null &&
    doc.getElementById('personal_postal_code') === null &&
    doc.getElementById('personal_country') === null
  if (noPersonalAddress) {
    const container = doc.getElementById('personal-address-container')
    container.parentNode.removeChild(container)
  }
  for (const field in req.data.registration) {
    const element = doc.getElementById(field)
    if (!element) {
      continue
    }
    if (element.tag === 'input') {
      element.setAttribute('value', req.body ? req.body[field] : req.data.registration[field] || '')
    } else if (element.tag === 'select') {
      dashboard.HTML.setSelectedOptionByValue(doc, field, req.body ? req.body[field] : req.data.registration[field] || '')
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  for (const pathAndField of req.data.fieldsNeeded) {
    let field = pathAndField.split('.').pop()
    if (field === 'external_account' ||
      field === 'additional_owners' ||
      field === 'type' ||
      field === 'ip' ||
      field === 'date' ||
      field === 'document') {
      continue
    }
    if (req.data.applicationCountry.id === 'JP') {
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
    if (!req.body[field]) {
      return renderPage(req, res, `invalid-${field}`)
    }
  }
  try {
    await global.api.user.connect.UpdateCompanyRegistration._patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
}

function formatStateData (divisions) {
  const states = []
  for (const division in divisions) {
    states.push({ value: division, text: divisions[division], object: 'option' })
  }
  return states
}
