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
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  const removeElements = []
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'client-v3', 'connect-v3', 'handler-v3')
  } else {
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline' 'unsafe-eval'; ` +
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
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].individual
  if (requiredFields.indexOf('business_profile.mcc') > -1) {
    const mccList = connect.getMerchantCategoryCodes(req.language)
    dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  }
  if (requiredFields.indexOf('individual.address.state') > -1) {
    const personalStates = connect.countryDivisions[req.data.stripeAccount.country]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'individual_address_state')
  }
  if (requiredFields.indexOf('individual.gender') === -1) {
    removeElements.push('individual_gender-container')
  }
  if (requiredFields.indexOf('individual.id_number') === -1) {
    removeElements.push('id_number-container')
  }
  if (requiredFields.indexOf('individual.ssn_last_4') === -1) {
    removeElements.push('ssn_last_4-container')
  }
  if (requiredFields.indexOf('individual.verification.additional_document.front') === -1) {
    removeElements.push('additional-upload-container')
  }
  if (req.data.registration.individual_id_number || req.data.registration.accountToken) {
    const idNumber = doc.getElementById('individual_id_number')
    idNumber.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_document_front) {
    const uploadFront = doc.getElementById('individual_verification_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_document_back) {
    const uploadBack = doc.getElementById('individual_verification_document_back')
    uploadBack.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_additional_document_front) {
    const uploadFront = doc.getElementById('individual_verification_additional_document_front')
    uploadFront.setAttribute('data-existing', true)
  }
  if (req.data.registration.individual_verification_additional_document_back) {
    const uploadBack = doc.getElementById('individual_verification_additional_document_back')
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
        dashboard.HTML.setSelectedOptionByValue(doc, field, req.data.registration[field] || '')
      }
    }
    if (req.data.registration.individual_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'individual_address_state', req.data.registration.individual_address_state)
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
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].individual
  for (const field of requiredFields) {
    const posted = field.split('.').join('_')
    if (!req.body[posted]) {
      if (field === 'individual.address.line2' ||
          field === 'individual.verification.document.front' ||
          field === 'individual.verification.document.back' ||
          field === 'individual.verification.additional_document.front' ||
          field === 'individual.verification.additional_document.back' ||
         (field === 'business_profile.url' && req.body.business_profile_product_description) ||
         (field === 'business_profile.product_description' && req.body.business_profile_url)) {
        continue
      }
      if (field === 'business_profile.product_description' && !req.body.business_profile_url) {
        return renderPage(req, res, 'invalid-business_profile_url')
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  if (requiredFields.indexOf('individual.verification.document.front') > -1) {
    if (!req.uploads || (
      !req.uploads.individual_verification_document_front &&
        !req.body.individual_verification_document_front)) {
      return renderPage(req, res, 'invalid-individual_verification_document_front')
    }
    if (!req.uploads || (
      !req.uploads.individual_verification_document_back &&
      !req.body.individual_verification_document_back)) {
      return renderPage(req, res, 'invalid-individual_verification_document_back')
    }
  }
  if (requiredFields.indexOf('individual.verification.additional_document.front') > -1) {
    if (!req.uploads || (
      !req.uploads.individual_verification_additional_document_front &&
      !req.body.individual_verification_additional_document_front)) {
      return renderPage(req, res, 'invalid-individual_verification_additional_document_front')
    }
    if (!req.uploads || (
      !req.uploads.individual_verification_additional_document_back &&
      !req.body.individual_verification_additional_document_back)) {
      return renderPage(req, res, 'invalid-individual_verification_additional_document_back')
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
