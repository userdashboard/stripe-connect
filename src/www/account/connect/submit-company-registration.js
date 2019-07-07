const connect = require('../../../../index.js')
const dashboard = require('@userappstore/dashboard')
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
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (stripeAccount.legal_entity.type === 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec._get(req)
  const fieldsNeeded = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data && stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.error = req.error || 'invalid-payment-details'
  }
  const completedBusinessOwners = stripeAccount.metadata.submittedOwners || fieldsNeeded.indexOf('legal_entity.additional_owners') === -1
  if (!completedBusinessOwners) {
    req.error = req.error || 'invalid-additional-owners'
  }
  let registrationComplete = true
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (!registration.documentid) {
    registrationComplete = false
  } else {
    for (const pathAndField of stripeAccount.verification.fields_needed) {
      const field = pathAndField.split('.').pop()
      if (field === 'external_account' ||
        field === 'type' ||
        field === 'ip' ||
        field === 'date' ||
        field === 'document') {
        continue
      }
      if (!registration[field]) {
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
    return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3F')}`
  }
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.SetCompanyRegistrationSubmitted._patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
