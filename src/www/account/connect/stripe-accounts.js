const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const stripeAccounts = await global.api.user.connect.StripeAccounts._get(req)
  if (!stripeAccounts || !stripeAccounts.length) {
    req.data = {}
    return
  }
  const company = []
  let individual
  if (stripeAccounts && stripeAccounts.length) {
    for (const stripeAccount of stripeAccounts) {
      stripeAccount.createdFormatted = dashboard.Timestamp.date(stripeAccount.created)
      if (stripeAccount.payouts_enabled) {
        stripeAccount.statusMessage = 'status-verified'
      } else if (stripeAccount.verification && stripeAccount.verification.disabled_reason) {
        stripeAccount.statusMessage = `status-${stripeAccount.verification.disabled_reason}`
      } else if (stripeAccount.verification && stripeAccount.verification.details_code) {
        stripeAccount.statusMessage = `status-${stripeAccount.verification.details_code}`
      } else if (stripeAccount.metadata.submitted) {
        stripeAccount.statusMessage = 'status-under-review'
      } else {
        stripeAccount.statusMessage = 'status-not-submitted'
      }
      if (stripeAccount.individual) {
        individual = stripeAccount
      } else {
        company.push(stripeAccount)
      }
    }
  }
  req.data = { stripeAccounts, individual, company }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html)
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    if (req.data.individual) {
      dashboard.HTML.renderTemplate(doc, req.data.individual, 'stripe-account-row', 'individual-accounts-table')
      doc.getElementById('create-individual-link').setAttribute('disabled', 'disabled')
    } else {
      const individualContainer = doc.getElementById('individual-container')
      individualContainer.parentNode.removeChild(individualContainer)
    }
    if (req.data.company && req.data.company.length) {
      dashboard.HTML.renderTable(doc, req.data.company, 'stripe-account-row', 'company-accounts-table')
    } else {
      const companyContainer = doc.getElementById('company-container')
      companyContainer.parentNode.removeChild(companyContainer)
    }
    noStripeAccounts = doc.getElementById('no-stripe-accounts')
    noStripeAccounts.parentNode.removeChild(noStripeAccounts)
  } else {
    const stripeAccountsTable = doc.getElementById('stripe-accounts-table')
    stripeAccountsTable.parentNode.removeChild(stripeAccountsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
