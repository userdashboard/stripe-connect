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
  const requiredFields = []
  switch (req.data.stripeAccount.country) {
    case 'AU':
      requiredFields.push()
      break
    case 'AT':
      requiredFields.push()
      break
    case 'BE':
      requiredFields.push()
      break
    case 'CA':
      requiredFields.push()
      break
    case 'CH':
      requiredFields.push()
      break
    case 'DE':
      requiredFields.push()
      break
    case 'DK':
      requiredFields.push()
      break
    case 'ES':
      requiredFields.push()
      break
    case 'FI':
      requiredFields.push()
      break
    case 'FR':
      requiredFields.push()
      break
    case 'GB':
      requiredFields.push()
      break
    case 'HK':
      requiredFields.push()
      break
    case 'IE':
      requiredFields.push()
      break
    case 'IT':
      requiredFields.push()
      break
    case 'JP':
      requiredFields.push()
      break
    case 'LU':
      requiredFields.push()
      break
    case 'NL':
      requiredFields.push()
      break
    case 'NZ':
      requiredFields.push()
      break
    case 'NO':
      requiredFields.push()
      break
    case 'PT':
      requiredFields.push()
      break
    case 'SG':
      requiredFields.push()
      break
    case 'SE':
      requiredFields.push()
      break
    case 'US':
      requiredFields.push()
      break
  }
  req.data = { stripeAccount, registration, requiredFields }
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
  const allFields = []
  for (const field of allFields) {
    if (req.data.requiredFields.indexOf(field) > -1) {
      continue
    }
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  if (req.data.requiredFields.indexOf('business_profile.mcc') > -1) {
    const mccList = connect.getMerchantCategoryCodes(req.language)
    dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  }
  if (req.data.requiredFields.indexOf('individual_address_country') > -1) {
    let personalCountry
    if (req.body) {
      personalCountry = req.body.individual_address_country
    }
    personalCountry = personalCountry || req.data.registration.individual_address_country
    personalCountry = personalCountry || req.data.stripeAccount.country
    const personalStates = connect.countryDivisions[personalCountry]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'individual_address_state')
    dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'individual_address_country')
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
    for (const selectid of ['individual_address_state', 'individual_address_country']) {
      if (req.data.registration[selectid]) {
        dashboard.HTML.setSelectedOptionByValue(doc, selectid, req.data.registration[selectid])
      }
    }
    for (const checkboxid of ['individual_executive', 'individual_director', 'individual_owner']) {
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
  for (const field of req.data.requiredFields) {
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
