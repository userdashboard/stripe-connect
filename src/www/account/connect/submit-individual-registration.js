const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
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
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.business_type === 'company' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec.get(req)
  const fieldsNeeded = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data &&
                           stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.error = req.error || 'invalid-payment-details'
  }
  let registrationComplete = true
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (!registration.individual_verification_document_front ||
    !registration.individual_verification_document_back) {
    registrationComplete = false
  } else {
    for (const field of fieldsNeeded) {
      if (field === 'external_account' ||
        field === 'business_type' ||
        field === 'tos_acceptance.ip' ||
        field === 'tos_acceptance.date' ||
        field === 'tos_acceptance.document' ||
        field === 'individual.verification.document') {
        continue
      }
      const posted = field.split('.').join('_')
      if (!registration[posted]) {
        registrationComplete = false
        break
      }
    }
  }
  if (!registrationComplete) {
    req.error = req.error || 'invalid-registration'
  }
  req.data = { stripeAccount, countrySpec, fieldsNeeded }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')

  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  try {
    req.data.stripeAccount = await global.api.user.connect.SetIndividualRegistrationSubmitted.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
