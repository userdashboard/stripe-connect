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
  if (req.session.lockURL === req.url && req.session.unlocked) {
    try {
      await global.api.user.connect.UpdateIndividualRegistration._patch(req)
    } catch (error) {
      req.error = error.message
    }
  }
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.legal_entity.type === 'company' ||
      stripeAccount.metadata.submitted ||
      stripeAccount.metadata.submittedOwners) {
    throw new Error('invalid-stripe-account')
  }
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  const countrySpecs = await global.api.user.connect.CountrySpecs._get(req)
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
  if (req.data.addressCountry) {
    dashboard.HTML.renderList(doc, formatStateData(req.data.addressCountry.divisions), 'state-option', 'state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'state', req.body ? req.body.state : req.data.registration.state)
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
    switch (name) {
      case 'day':
      // case 'month':
      // case 'year':
        removeElements.push(`dob-container`)
        continue
      case 'email':
      case 'phone_number':
      case 'gender':
      case 'personal_id_number':
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
  for (const field in req.data.registration) {
    const element = doc.getElementById(field)
    if (!element) {
      continue
    }
    if (element.tag === 'input') {
      element.setAttribute('value', req.body ? req.body[field] : req.data.registration[field] || '')
    } else if (element.tag === 'select') {
      dashboard.HTML.setSelectedOptionByValue(doc, field, req.body ? req.body[field]: req.data.registration[field] || '')
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
    if (!req.body[field]) {
      return renderPage(req, res, `invalid-${field}`)
    }
  }
  try {
    await global.api.user.connect.UpdateIndividualRegistration._patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return dashboard.Response.redirect(req, res, '/account/authorize')
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
