const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts._get(req)
  for (const stripeAccount of stripeAccounts) {
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
  }
  req.data = { stripeAccounts }
}

async function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.route.html)
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    dashboard.HTML.renderTable(doc, req.data.stripeAccounts, 'stripe-account-row', 'stripe-accounts-table')
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.legal_entity.type === 'individual') {
        const businessName = doc.getElementById(`business-name-${stripeAccount.id}`)
        businessName.parentNode.removeChild(businessName)
      } else {
        const individualName = doc.getElementById(`individual-name-${stripeAccount.id}`)
        individualName.parentNode.removeChild(individualName)
      }
    }
    noStripeAccounts = doc.getElementById('no-stripe-accounts')
    noStripeAccounts.parentNode.removeChild(noStripeAccounts)
  } else {
    const stripeAccountsTable = doc.getElementById('stripe-accounts-table')
    stripeAccountsTable.parentNode.removeChild(stripeAccountsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
