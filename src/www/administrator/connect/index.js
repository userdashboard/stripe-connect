const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts.get(req)
  if (!stripeAccounts || !stripeAccounts.length) {
    return
  }
  for (const stripeAccount of stripeAccounts) {
    stripeAccount.createdFormatted = dashboard.Format.date(stripeAccount.created)
    stripeAccount.individual = stripeAccount.individual || {}
    stripeAccount.company = stripeAccount.company || {}
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
  }
  req.data = { stripeAccounts }
}

async function renderPage (req, res) {
  const doc = dashboard.HML.parse(req.html || req.route.html)
  if (req.data && req.data.stripeAccounts && req.data.stripeAccounts.length) {
    dashboard.HTML.renderTable(doc, req.data.stripeAccounts, 'stripe-account-row', 'stripe-accounts-table')
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.business_type === 'individual') {
        const businessName = doc.getElementById(`business-name-${stripeAccount.id}`)
        businessName.parentNode.removeChild(businessName)
      } else {
        const individualName = doc.getElementById(`individual-name-${stripeAccount.id}`)
        individualName.parentNode.removeChild(individualName)
      }
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `account-status-${stripeAccount.id}`)
      }
    }
  } else {
    const registrationsContainer = doc.getElementById('registrations-container')
    registrationsContainer.parentNode.removeChild(registrationsContainer)
  }
  return dashboard.Response.end(req, res, doc)
}
