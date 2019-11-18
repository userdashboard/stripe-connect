const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

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
  stripeAccount.stripePublishableKey = global.stripePublishableKey
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  const fieldsNeeded = stripeAccount.requirements.past_due.concat(stripeAccount.requirements.eventually_due)
  req.data = { stripeAccount, fieldsNeeded, registration }
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
  const removeElements = []
  if (global.stripeJS !== 3) {
    removeElements.push('form-v3', 'stripe-v3', 'cient-v3', 'connect-js', 'handler')
  } else {
    res.setHeader('content-security-policy',
    'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/stripe-helper.js 'unsafe-inline' 'unsafe-eval'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.country !== 'jp') {
    removeElements.push(
      'individual_gender-container',
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
        removeElements.push('dob-container')
        continue
      case 'email':
      case 'phone':
      case 'id_number':
      case 'ssn_last_4':
        removeElements.push(`${name}-container`)
        continue
    }
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  const mccList = connect.getMerchantCategoryCodes(req.language)
  dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  dashboard.HTML.renderList(doc, connect.countryList, 'state-option', 'individual_address_country')
  if (req.method === 'GET') {
    const selectedCountry = req.data.registration.country || req.data.stripeAccount.country.toUpperCase()
    const states = connect.countryDivisions[selectedCountry]
    dashboard.HTML.renderList(doc, states, 'state-option', 'individual_address_state')
    if (req.data.registration.individual_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'individual_address_state', req.data.registration.individual_address_state)
    }
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
  if (req.data.registration.individual_id_number || req.data.registration.accountToken) {
    const uploadFront = doc.getElementById('individual_id_number')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_document_front) {
    const uploadFront = doc.getElementById('individual_verification_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_document_back) {
    const uploadBack = doc.getElementById('individual_verification_document_back')
    uploadBack.setAttribute('data-existing', true)
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
