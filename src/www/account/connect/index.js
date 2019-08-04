const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const stripeAccounts = await global.api.user.connect.StripeAccounts.get(req)
  const company = []
  let individual
  if (stripeAccounts && stripeAccounts.length) {
    for (const stripeAccount of stripeAccounts) {
    stripeAccount.createdFormatted = dashboard.Format.date(stripeAccount.created)
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
      if (stripeAccount.legal_entity.type === 'individual') {
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
  const removeElements = []
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    if (req.data.individual) {
      dashboard.HTML.renderTemplate(doc, req.data.individual, 'stripe-account-row', 'individual-accounts-table')
      dashboard.HTML.renderTemplate(doc, null, req.data.individual.statusMessage, `account-status-${req.data.individual.id}`)
      doc.getElementById('create-individual-link').setAttribute('disabled', 'disabled')
      removeElements.push('business-name-' + req.data.individual.id)
    } else {
      removeElements.push('individual-container')
    }
    if (req.data.company && req.data.company.length) {
      dashboard.HTML.renderTable(doc, req.data.company, 'stripe-account-row', 'company-accounts-table')
      for (const account of req.data.company) {
        dashboard.HTML.renderTemplate(doc, null, account.statusMessage, `account-status-${account.id}`)
        const individualName = doc.getElementById('individual-name-' + account.id)
        individualName.parentNode.removeChild(individualName)
      }
    } else {
      removeElements.push('company-container')
    }
  } else {
    removeElements.push('individual-container', 'company-container')
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
