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
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
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
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-eval' 'unsafe-inline'; ` +
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
  if (req.data.stripeAccount.country !== 'JP') {
    removeElements.push(
      'gender-container',
      'kanji-personal-address-container',
      'kana-personal-address-container',
      'kana-personal-information-container',
      'kanji-personal-information-container')
  } else {
    removeElements.push('personal-address-container')
  }
  let personalCountry
  if (req.body) {
    personalCountry = req.body.address_country
  }
  personalCountry = personalCountry || req.data.stripeAccount.country
  const personalStates = connect.countryDivisions[personalCountry]
  dashboard.HTML.renderList(doc, personalStates, 'state-option', 'address_state')
  dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'address_country')
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyRepresentativeTemplate)
  if (requirements.currently_due.indexOf('relationship.representative.id_number') === -1) {
    removeElements.push('id_number-container')
  }
  if (req.body) {
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
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyRepresentativeTemplate)
  for (const field of requirements.currently_due) {
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      if (field === 'relationship.representative.address.line2' ||
          field === 'relationship.representative.relationship.title' ||
          field === 'relationship.representative.relationship.executive' ||
          field === 'relationship.representative.relationship.director' ||
          field === 'relationship.representative.relationship.owner' ||
          field === 'relationship.representative.verification.document.front' ||
          field === 'relationship.representative.verification.document.back' ||
          field === 'relationship.representative.verification.additional_document.front' ||
          field === 'relationship.representative.verification.additional_document.back') {
        continue
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  if (requirements.currently_due.indexOf('relationship.representative.verification.document.front') > -1) {
    if (!req.uploads || (
      !req.uploads.verification_document_front &&
        !req.body.verification_document_front)) {
      return renderPage(req, res, 'invalid-verification_document_front')
    }
    if (!req.uploads || (
      !req.uploads.verification_document_back &&
      !req.body.verification_document_back)) {
      return renderPage(req, res, 'invalid-verification_document_back')
    }
  }
  if (requirements.currently_due.indexOf('relationship.representative.verification.additional.document.front') > -1) {
    if (!req.uploads || (
      !req.uploads.verification_additional_document_front &&
      !req.body.verification_additional_document_front)) {
      return renderPage(req, res, 'invalid-verification_additional_document_front')
    }
    if (!req.uploads || (
      !req.uploads.verification_additional_document_back &&
      !req.body.verification_additional_document_back)) {
      return renderPage(req, res, 'invalid-verification_additional_document_back')
    }
  }
  try {
    await global.api.user.connect.CreateCompanyRepresentative.post(req)
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
