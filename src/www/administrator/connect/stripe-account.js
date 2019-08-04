const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
  stripeAccount.createdFormatted = dashboard.Format.date(stripeAccount.created)
  if (stripeAccount.metadata.submitted) {
    stripeAccount.metadata.submittedFormatted = dashboard.Format.date(stripeAccount.metadata.submitted)
  } else {
    stripeAccount.metadata.submittedFormatted = ''
  }
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

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status`)
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    const businessName = doc.getElementById(`business-name-${req.data.stripeAccount.id}`)
    businessName.parentNode.removeChild(businessName)
  } else {
    const individualName = doc.getElementById(`individual-name-${req.data.stripeAccount.id}`)
    individualName.parentNode.removeChild(individualName)
  }
  return dashboard.Response.end(req, res, doc)
}
