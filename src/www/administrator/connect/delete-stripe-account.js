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
  const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.requirements.disabled_reason) {
    stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
  } else if (stripeAccount.requirements.details_code) {
    stripeAccount.statusMessage = stripeAccount.requirements.details_code
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  stripeAccount.individual = stripeAccount.individual || {}
  stripeAccount.company = stripeAccount.company || {}
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  stripeAccount.registration = registration
  req.data = { stripeAccount, registration }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, 'account-status')
  const mccCodes = connect.getMerchantCategoryCodes(req.language)
  const mccDescription = doc.getElementById('mcc-description')
  for (const code of mccCodes) {
    if (code.code === req.data.stripeAccount.business_profile.mcc) {
      mccDescription.innerHTML = code.description
      break
    }
  }
  const removeElements = []
  if (req.data.stripeAccount.business_type === 'individual') {
    removeElements.push('business-name', 'business-registration-name')
    if (req.data.stripeAccount.individual.first_name) {
      removeElements.push('blank-name', 'individual-registration-name')
    } else {
      removeElements.push('individual-name')
      if (req.data.registration.individual_first_name) {
        removeElements.push('blank-name')
      } else {
        removeElements.push('individual-registration-name')
      }
    }
  } else {
    removeElements.push('individual-name', 'individual-registration-name')
    if (req.data.stripeAccount.company.name) {
      removeElements.push('blank-name', 'business-registration-name')
    } else {
      removeElements.push('business-name')
      if (req.data.registration.company_name) {
        removeElements.push('blank-name')
      } else {
        removeElements.push('business-registration-name')
      }
    }
  }
  if (messageTemplate) {
    if (messageTemplate === 'success') {
      removeElements.push('submit-form', 'stripe-accounts-table')
    }
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.connect.DeleteStripeAccount.delete(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
