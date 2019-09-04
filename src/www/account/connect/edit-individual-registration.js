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
  if (stripeAccount.business_type === 'company' ||
      stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  const countrySpecs = await global.api.user.connect.CountrySpecs.get(req)
  let applicationCountry, addressCountry
  for (const countrySpec of countrySpecs) {
    if (countrySpec.id === stripeAccount.country) {
      applicationCountry = countrySpec
      break
    }
  }
  for (const countryItem of countriesDivisions) {
    if (countryItem.code === applicationCountry.id) {
      addressCountry = countryItem
      break
    }
  }
  let countrySpec
  for (const spec of countrySpecs) {
    if (spec.id === stripeAccount.country) {
      countrySpec = spec
      break
    }
  }
  const fieldsNeeded = applicationCountry.verification_fields.individual.minimum.concat(applicationCountry.verification_fields.individual.additional)
  req.data = { stripeAccount, countries, countrySpec, countrySpecs, applicationCountry, addressCountry, fieldsNeeded, registration }
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
  if (req.data.addressCountry) {
    dashboard.HTML.renderList(doc, formatStateData(req.data.addressCountry.divisions), 'state-option', 'individual_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'individual_address_state', req.body ? req.body.state : req.data.registration.state)
  }
  const removeElements = []
  if (req.data.applicationCountry.id !== 'JP') {
    removeElements.push(
      'kana-personal-information-container',
      'kanji-personal-information-container',
      'kana-personal-address-container',
      'kanji-personal-address-container'
    )
  } else {
    removeElements.push(
      'personal-information-container',
      'personal-address-container'
    )
  }
  // remove unrequired fields
  const removableFields = [
    'business_profile_url',
    'business_profile_mcc',
    'individual.email',
    'individual.phone',
    'individual.gender',
    'individual.id_number',
    'individual.ssn_last_4',
    'individual.address.line1',
    'individual.address.line2',
    'individual.address.city',
    'individual.address.state',
    'individual.address.postal_code',
    'individual.dob.day',
    'individual.dob.month',
    'individual.dob.year'
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
    switch (name) {
      case 'day':
      // case 'month':
      // case 'year':
        removeElements.push(`dob-container`)
        continue
      case 'email':
      case 'phone':
      case 'gender':
      case 'id_number':
      case 'ssn_last_4':
        removeElements.push(`${name}-container`)
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
      field === 'business_type' ||
      field === 'tos_acceptance.date' ||
      field === 'tos_acceptance.ip' ||
      field === 'tos_acceptance.user_agent' ||
      field === 'individual.verification.document') {
      continue
    }
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  try {
    await global.api.user.connect.UpdateIndividualRegistration.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
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
