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
    stripeAccount.statusMessage = 'status-verified'
  } else if (stripeAccount.verification.disabled_reason) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.disabled_reason}`
  } else if (stripeAccount.verification.details_code) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.details_code}`
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'status-under-review'
  } else {
    stripeAccount.statusMessage = 'status-not-submitted'
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status`)
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    const businessName = doc.getElementById('business-name')
    businessName.parentNode.removeChild(businessName)
  } else {
    const individualName = doc.getElementById('individual-name')
    individualName.parentNode.removeChild(individualName)
  }
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3F')}`
  }
  if (messageTemplate) {
    if (messageTemplate === 'success') {
      dashboard.HTML.renderTemplate(doc, null, 'success', 'message-container')
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      const accountTable = doc.getElementById('stripe-accounts-table')
      accountTable.parentNode.removeChild(accountTable)
      return dashboard.Response.end(req, res, doc)
    }
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.connect.SetStripeAccountRejected.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    if (error.code === 'invalid-request') {
      return renderPage(req, res, 'balance-error')
    }
    return renderPage(req, res, error.message)
  }
}
