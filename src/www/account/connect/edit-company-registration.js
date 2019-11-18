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
  if (stripeAccount.business_type === 'individual' ||
      stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  console.log(registration)
  const fieldsNeeded = stripeAccount.requirements.past_due.concat(stripeAccount.requirements.eventually_due)
  req.data = { stripeAccount, registration, fieldsNeeded }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid }`)
    }
  } else if (req.error) {
    messageTemplate = req.error
  }
  req.data.stripeAccount.stripePublishableKey = global.stripePublishableKey
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
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
  if (req.data.stripeAccount.country !== 'jp') {
    removeElements.push(
      'gender-container',
      'kana-company-information-container', 'kana-company-address-container',
      'kana-personal-information-container', 'kana-personal-address-container',
      'kanji-company-information-container', 'kanji-company-address-container',
      'kanji-personal-information-container', 'kanji-personal-address-container'
    )
  } else {
    removeElements.push('personal-address-container')
  }
  for (const field of ['company.address.city', 'company.address.line1', 'company.address.postal_code', 'company.name', 'company.tax_id', 'company.phone']) {
    if (req.data.fieldsNeeded.indexOf(field) === -1) {
      const id = field.split('.').join('_')
      removeElements.push(`${id}-container`)
    }
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
  if (removeElements.indexOf('company_address_line1-container') === -1) {
    removeElements.splice(removeElements.indexOf('company_address_line2-container'), 1)
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  if (req.data.registration.relationship_account_opener_id_number || req.data.registration.accountToken) {
    const uploadFront = doc.getElementById('relationship_account_opener_id_number')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_account_opener_verification_document_front) {
    const uploadFront = doc.getElementById('relationship_account_opener_verification_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_account_opener_verification_document_back) {
    const uploadBack = doc.getElementById('relationship_account_opener_verification_document_back')
    uploadBack.setAttribute('data-existing', true)
  }
  const mccList = connect.getMerchantCategoryCodes(req.language)
  dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  if (req.method === 'GET') {
    dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'relationship_account_opener_address_country')
    dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'company_address_country')
    const personalCountry = req.data.registration.relationship_account_opener_address_country || req.data.stripeAccount.country.toUpperCase()
    const personalStates = connect.countryDivisions[personalCountry]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'relationship_account_opener_address_state')
    const companyCountry = req.data.registration.company_address_country || req.data.stripeAccount.country.toUpperCase()
    const companyStates = connect.countryDivisions[companyCountry]
    dashboard.HTML.renderList(doc, companyStates, 'state-option', 'company_address_state')
    for (const field in req.data.registration) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      if (element.tag === 'input') {
        element.setAttribute('value', req.data.registration[field] || '')
      } 
    }
    if (req.data.registration.company_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'company_address_state', req.data.registration.company_address_state)
    }
    dashboard.HTML.setSelectedOptionByValue(doc, 'company_address_country', companyCountry)
    if (req.data.registration.relationship_account_opener_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_account_opener_address_state', req.data.registration.relationship_account_opener_address_state)
    }
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_account_opener_address_country', personalCountry)
    if (req.data.registration.relationship_account_opener_executive) {
      doc.getElementById('relationship_account_opener_executive').setAttribute('checked', true)
    }
    if (req.data.registration.relationship_account_opener_director) {
      doc.getElementById('relationship_account_opener_director').setAttribute('checked', true)
    }
    if (req.data.registration.relationship_account_opener_owner) {
      doc.getElementById('relationship_account_opener_owner').setAttribute('checked', true)
    }
  } else if (req.body) {
    const personalCountry = req.body.relationship_account_opener_address_country || req.data.registration.relationship_account_opener_address_country || req.data.stripeAccount.country.toUpperCase()
    const personalStates = connect.countryDivisions[personalCountry]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'relationship_account_opener_address_state')
    const companyCountry = req.body.company_address_country || req.data.stripeAccount.country.toUpperCase()
    const companyStates = connect.countryDivisions[companyCountry]
    dashboard.HTML.renderList(doc, companyStates, 'state-option', 'company_address_state')
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
