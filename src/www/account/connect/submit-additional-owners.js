const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  if (req.session.lockURL === req.url && req.session.unlocked) {
    try {
      await global.api.user.connect.SetAdditionalOwnersSubmitted.patch(req)
    } catch (error) {
      req.error = error.message
    }
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  if (stripeAccount.legal_entity.type === 'individual') {
    throw new Error('invalid-stripe-account')
  }
  if (!req.success && stripeAccount.metadata.submittedOwners) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec.get(req)
  if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
    countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { stripeAccount, countrySpec }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL) {
      return dashboard.Response.redirect(req, res, req.query.returnURL)
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (req.data.stripeAccount.metadata.submittedOwners || messageTemplate === 'success') {
    dashboard.HTML.renderTemplate(doc, null, 'success', 'message-container')
    const submitForm = doc.getElementById('submit-form')
    submitForm.parentNode.removeChild(submitForm)
  } else if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.body && req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.SetAdditionalOwnersSubmitted.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return dashboard.Response.redirect(req, res, '/account/authorize')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
