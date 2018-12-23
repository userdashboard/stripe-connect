const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
  if (stripeAccount.legal_entity.type === 'individual') {
    stripeAccount.first_name = stripeAccount.legal_entity.first_name
    stripeAccount.last_name = stripeAccount.legal_entity.last_name
  } else {
    stripeAccount.business_name = stripeAccount.legal_entity.business_name
  }
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.verification.disabled_reason) {
    stripeAccount.statusMessage = `${stripeAccount.verification.disabled_reason}`
  } else if (stripeAccount.verification.details_code) {
    stripeAccount.statusMessage = `${stripeAccount.verification.details_code}`
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    const businessName = doc.getElementById(`business-name-${req.data.stripeAccount.id}`)
    businessName.parentNode.removeChild(businessName)
  } else {
    const individualName = doc.getElementById(`individual-name-${req.data.stripeAccount.id}`)
    individualName.parentNode.removeChild(individualName)
  }
  return dashboard.Response.end(req, res, doc)
}
