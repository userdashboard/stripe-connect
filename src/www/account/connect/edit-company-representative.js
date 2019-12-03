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
  req.data = { stripeAccount, registration }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
    }
  } else if (req.error) {
    messageTemplate = req.error
  }
  req.data.stripeAccount.stripePublishableKey = global.stripePublishableKey
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  const removeElements = []
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'client-v3', 'connect-v3', 'handler-v3')
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
      removeElements.push('form-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].companyRepresentative
  if (requiredFields.indexOf('relationship_representative_address_country') > -1) {
    let personalCountry
    if (req.body) {
      personalCountry = req.body.relationship_representative_address_country
    }
    personalCountry = personalCountry || req.data.registration.relationship_representative_address_country
    personalCountry = personalCountry || req.data.stripeAccount.country
    const personalStates = connect.countryDivisions[personalCountry]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'relationship_representative_address_state')
    dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'relationship_representative_address_country')
  }
  if (req.data.registration.relationship_representative_id_number || req.data.registration.accountToken) {
    const uploadFront = doc.getElementById('relationship_representative_id_number')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_representative_verification_document_front) {
    const uploadFront = doc.getElementById('relationship_representative_verification_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_representative_verification_document_back) {
    const uploadBack = doc.getElementById('relationship_representative_verification_document_back')
    uploadBack.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_representative_verification_additional_document_front) {
    const uploadFront = doc.getElementById('relationship_representative_verification_additional_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.relationship_representative_verification_additional_document_back) {
    const uploadBack = doc.getElementById('relationship_representative_verification_additional_document_back')
    uploadBack.setAttribute('data-existing', true)
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
        dashboard.HTML.setSelectedOptionByValue(doc, element, req.data.registration[field] || '')
      }
    }
    for (const selectid of ['relationship_representative_address_state', 'relationship_representative_address_country']) {
      if (req.data.registration[selectid]) {
        dashboard.HTML.setSelectedOptionByValue(doc, selectid, req.data.registration[selectid])
      }
    }
    for (const checkboxid of ['relationship_representative_executive', 'relationship_representative_director', 'relationship_representative_owner']) {
      if (req.data.registration[checkboxid]) {
        doc.getElementById(checkboxid).setAttribute('checked', true)
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
        dashboard.HTML.setSelectedOptionByValue(doc, element, req.body[field] || '')
      }
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].companyRepresentative
  for (const field of requiredFields) {
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      if (field === 'relationship.representative.address.line2') {
        continue
      }
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
