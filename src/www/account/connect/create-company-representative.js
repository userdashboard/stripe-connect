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
  stripeAccount.stripePublishableKey = global.stripePublishableKey
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.business_type === 'individual') {
    throw new Error('invalid-stripe-account')
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  console.log('render', messageTemplate)
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
      'kanji-personal-address-container',
      'kana-personal-address-container',
      'kana-personal-information-container',
      'kanji-personal-information-container')
  } else {
    removeElements.push('personal-address-container')
  }
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyRepresentativeTemplate)
  if (requirements.currently_due.indexOf('address.state') > -1) {
    const personalStates = connect.countryDivisions[req.data.stripeAccount.country]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'address_state')
  } else if (req.data.stripeAccount.country !== 'JP') {
    removeElements.push('state-container', 'state-container-bridge')
  }
  if (requirements.currently_due.indexOf('gender') === -1) {
    removeElements.push('gender-container')
  }
  if (requirements.currently_due.indexOf('id_number') === -1) {
    removeElements.push('id_number-container')
  }
  if (requirements.currently_due.indexOf('email') === -1) {
    removeElements.push('email-container')
  }
  if (requirements.currently_due.indexOf('phone') === -1) {
    removeElements.push('phone-container')
  }
  if (requirements.currently_due.indexOf('ssn_last_4') === -1) {
    removeElements.push('ssn_last_4-container')
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
    if (!element || !element.parentNode) {
      console.log(id)
    }
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyRepresentativeTemplate)
  for (const field of requirements.currently_due) {
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      if (field === 'address.line2' ||
          field === 'relationship.title' ||
          field === 'relationship.executive' ||
          field === 'relationship.director' ||
          field === 'relationship.owner' ||
          field === 'verification.document.front' ||
          field === 'verification.document.back' ||
          field === 'verification.additional_document.front' ||
          field === 'verification.additional_document.back') {
        continue
      }
      console.log('invalid field', field)
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
  console.log('updating', req.body)
  let person
  try {
    person = await global.api.user.connect.CreateCompanyRepresentative.post(req)
    console.log(requirements)
  } catch (error) {
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/account/connect/stripe-account?stripeid=${req.query.stripeid}`
    })
    return res.end()
  }
}
