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
  if (stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  stripeAccount.stripePublishableKey = global.stripePublishableKey
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
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
      removeElements.push('business-profile-container', 'company-container', 'personal-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        if (!element) {
          continue
        }
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.country !== 'JP') {
    removeElements.push(
      'kanji-address-container',
      'kana-address-container',
      'JP-company-name-container')
  }
  let requireAddress = false
  for (const field of req.data.stripeAccount.requirements.currently_due) {
    requireAddress = field.indexOf(`${req.data.stripeAccount.business_type}.address`) > -1
    if (requireAddress) {
      break
    }
  }
  if (!requireAddress) {
    removeElements.push('address-container')
  } else {
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.stripeAccount.business_type}.address.line1`) === -1) {
      removeElements.push('address_line1-container', 'address_line2-container')
    }
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.stripeAccount.business_type}.address.city`) === -1) {
      removeElements.push('address_city-container')
    }
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.stripeAccount.business_type}.address.state`) === -1) {
      removeElements.push('address_state-container')
    }
    if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.stripeAccount.business_type}.address.postal_code`) === -1) {
      removeElements.push('address_postal_code-container')
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('business_profile.mcc') > -1) {
    const mccList = connect.getMerchantCategoryCodes(req.language)
    dashboard.HTML.renderList(doc, mccList, 'mcc-option', 'business_profile_mcc')
  } else {
    removeElements.push('business_profile_mcc-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('business_profile.url') === -1) {
    removeElements.push('business_profile_url-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.stripeAccount.business_type}.address.state`) > -1) {
    const personalStates = connect.countryDivisions[req.data.stripeAccount.country]
    dashboard.HTML.renderList(doc, personalStates, 'state-option', 'address_state')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('company.phone') === -1) {
    removeElements.push('phone-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('company.tax_id') === -1) {
    removeElements.push('tax_id-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.phone') === -1) {
    removeElements.push('phone-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.email') === -1) {
    removeElements.push('email-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.gender') === -1) {
    removeElements.push('gender-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.id_number') === -1) {
    removeElements.push('id_number-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.ssn_last_4') === -1) {
    removeElements.push('ssn_last_4-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('company.verification.document') === -1) {
    removeElements.push('verification_document-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.verification.document') === -1) {
    removeElements.push('verification_document-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.verification.additional_document') === -1) {
    removeElements.push('verification_additional_document-container')
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
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  for (const field of req.data.stripeAccount.requirements.currently_due) {
    const posted = field.split('.').join('_').replace('company_', '').replace('individual_', '')
    if (!req.body[posted]) {
      if (field === 'address.line2' ||
        field === 'company.verification.document' ||
        field === 'individual.verification.document' ||
        field === 'individual.verification.additional_document' ||
        field === 'relationship.owner' ||
        field === 'relationship.director' ||
        field === 'external_account' ||
        field.startsWith('relationship.') ||
        field.startsWith('tos_acceptance.') ||
        field.startsWith('person_') ||
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
  if (req.data.stripeAccount.requirements.currently_due.indexOf('company.verification.document') > -1) {
    if (!req.uploads || !req.uploads.verification_document_front) {
      return renderPage(req, res, 'invalid-verification_document_front')
    }
    if (!req.uploads || !req.uploads.verification_document_back) {
      return renderPage(req, res, 'invalid-verification_document_back')
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.verification.document') > -1) {
    if (!req.uploads || !req.uploads.verification_document_front) {
      return renderPage(req, res, 'invalid-verification_document_front')
    }
    if (!req.uploads || !req.uploads.verification_document_back) {
      return renderPage(req, res, 'invalid-verification_document_back')
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf('individual.verification.additional_document') > -1) {
    if (!req.uploads || !req.uploads.verification_additional_document_front) {
      return renderPage(req, res, 'invalid-verification_additional_document_front')
    }
    if (!req.uploads || !req.uploads.verification_additional_document_back) {
      return renderPage(req, res, 'invalid-verification_additional_document_back')
    }
  }
  try {
    await global.api.user.connect.UpdateStripeAccount.patch(req)
  } catch (error) {
    if (error.message.startsWith('invalid-company_')) {
      return renderPage(req, res, error.message.replace('company_', ''))
    }
    if (error.message.startsWith('invalid-individual_')) {
      return renderPage(req, res, error.message.replace('individual_', ''))
    }
    if (error.message.startsWith('invalid-')) {
      return renderPage(req, res, error.message)
    }
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?stripeid=${req.query.stripeid}&message=success`
    })
    return res.end()
  }
}
