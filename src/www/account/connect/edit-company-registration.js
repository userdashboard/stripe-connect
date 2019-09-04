const connect = require('../../../../index.js')
const countries = require('../../../../countries.json')
const countriesDivisions = require('../../../../countries-divisions.json')
const dashboard = require('@userdashboard/dashboard')
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
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.business_type === 'individual' ||
      stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  const countrySpecs = await global.api.user.connect.CountrySpecs.get(req)
  let applicationCountry, personalAddress, companyAddressCountry
  for (const countrySpec of countrySpecs) {
    if (countrySpec.id === stripeAccount.country) {
      applicationCountry = countrySpec
      break
    }
  }
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (req.body) {
    for (const countryItem of countriesDivisions) {
      if (countryItem.code === req.body.relationship_account_opener_address_country) {
        personalAddress = countryItem
      }
      if (countryItem.code === req.body.company_address_country) {
        companyAddressCountry = countryItem
      }
      if (companyAddressCountry && personalAddress) {
        break
      }
    }
  }
  if (!personalAddress) {
    if (req.body && req.body.relationship_account_opener_address_country) {
      req.error = 'invalid-relationship_account_opener_address_country'
      return
    }
    for (const countryItem of countriesDivisions) {
      if (countryItem.code === stripeAccount.country) {
        personalAddress = countryItem
        break
      }
    }
  }
  if (!companyAddressCountry) {
    if (req.body && req.body.company_address_country) {
      req.error = 'invalid-company_address_country'
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
  req.data = { stripeAccount, countries, countrySpec, countrySpecs, applicationCountry, personalAddress, companyAddressCountry, registration, fieldsNeeded }
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
  if (req.query && req.query.returnURL) {
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
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'relationship_account_opener_address_country')
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'company_address_country')
  if (req.data.personalAddress) {
    const states = formatStateData(req.data.personalAddress.divisions)
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_account_opener_address_country', req.data.personalAddress.code)
    dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_account_opener_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_account_opener_address_state', req.data.personalAddress.code)
  }
  if (req.data.companyAddressCountry) {
    const states = formatStateData(req.data.companyAddressCountry.divisions)
    dashboard.HTML.setSelectedOptionByValue(doc, 'company_address_country', req.data.companyAddressCountry.code)
    dashboard.HTML.renderList(doc, states, 'state-option', 'company_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'company_address_state', req.data.personalAddress.code)
  }
  const removeElements = []
  if (req.data.applicationCountry.id !== 'JP') {
    removeElements.push(
      'relationship_account_opener_gender',
      'kana-company-information-container', 'kana-company-address-container',
      'kana-personal-information-container', 'kana-personal-address-container',
      'kanji-company-information-container', 'kanji-company-address-container',
      'kanji-personal-information-container', 'kanji-personal-address-container'
    )
  }
  for (const field of ['company.address.city', 'company.address.line1', 'company.address.line2', 'company.address.postal_code', 'company.name', 'company.tax_id', 'business_profile.url', 'business_profile.mcc', 'company.phone']) {
    if (req.data.fieldsNeeded.indexOf(field) === -1) {
      const id = field.split('.').join('_')
      removeElements.push(`${id}-container`)
    }
  }
  if (req.data.registration.document) {
    removeElements.push('first-upload-container')
  } else {
    removeElements.push('replace-upload-container')
  }
  const noPersonalAddress = removeElements.indexOf('relationship_account_opener_line1-container') > -1 &&
    removeElements.indexOf('relationship_account_opener_address_line2-container') > -1 &&
    removeElements.indexOf('relationship_account_opener_address_city-container') > -1 &&
    removeElements.indexOf('relationship_account_opener_address_state-container') > -1 &&
    removeElements.indexOf('relationship_account_opener_address_postal_code-container') > -1 &&
    removeElements.indexOf('relationship_account_opener_address_country-container') > -1
  if (noPersonalAddress) {
    removeElements.push('personal-information-address-container')
  }
  const noCompanyAddress = removeElements.indexOf('company_address_line1-container') > -1 &&
    removeElements.indexOf('company_address_line2-container') > -1 &&
    removeElements.indexOf('company_address_city-container') > -1 &&
    removeElements.indexOf('company_address_state-container') > -1 &&
    removeElements.indexOf('company_address_postal_code-container') > -1 &&
    removeElements.indexOf('company_address_country-container') > -1
  if (noCompanyAddress) {
    removeElements.push('company-address-container')
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  if (req.method === 'GET') {
    for (const field in req.data.registration) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      if (element.tag === 'input') {
        element.setAttribute('value', req.data.registration[field] || '')
      } else if (element.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, field, req.data.registration[field] || '')
      }
    }
  } else if (req.body) {
    for (const field in req.body) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      if (element.tag === 'input') {
        element.setAttribute('value', req.body[field] || '')
      } else if (element.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, field, req.body[field] || '')
      }
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  for (const field of req.data.fieldsNeeded) {
    if (field === 'external_account' ||
      field === 'type' ||
      field === 'tos_acceptance.ip' ||
      field === 'tos_acceptance.date' ||
      field === 'business_type' ||
      field === 'relationship.owner' ||
      field === 'relationship.director' ||
      field === 'relationship.account_opener') {
      continue
    }
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  try {
    await global.api.user.connect.UpdateCompanyRegistration.patch(req)
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
