const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const stripeAccounts = await global.api.administrator.connect.StripeAccounts.get(req)
  for (const stripeAccount of stripeAccounts) {
    stripeAccount.createdFormatted = dashboard.Format.date(stripeAccount.created)
    if (stripeAccount.metadata.submitted) {
      stripeAccount.metadata.submittedFormatted = dashboard.Format.date(stripeAccount.metadata.submitted)
    } else {
      stripeAccount.metadata.submittedFormatted = ''
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

async function renderPage (req, res) {
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
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `account-status-${stripeAccount.id}`)
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
