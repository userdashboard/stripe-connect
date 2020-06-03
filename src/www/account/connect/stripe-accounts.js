const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  req.query.offset = 0
  const stripeAccounts = await global.api.user.connect.StripeAccounts.get(req)
  if (!stripeAccounts || !stripeAccounts.length) {
    req.data = {}
    return
  }
  const company = []
  let individual
  if (stripeAccounts && stripeAccounts.length) {
    for (const stripeAccount of stripeAccounts) {
      stripeAccount.company = stripeAccount.company || {}
      stripeAccount.individual = stripeAccount.individual || {}
      stripeAccount.createdFormatted = dashboard.Format.date(stripeAccount.created)
      if (stripeAccount.metadata.submitted) {
        stripeAccount.metadata.submittedFormatted = dashboard.Format.date(stripeAccount.metadata.submitted)
      }
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
      if (stripeAccount.business_type === 'individual') {
        individual = stripeAccount
      } else {
        company.push(stripeAccount)
      }
    }
  }
  req.data = { stripeAccounts, individual, company }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, null, null, req.language)
  const removeElements = []
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    if (req.data.individual) {
      dashboard.HTML.renderTemplate(doc, req.data.individual, 'stripe-account-row', 'individual-accounts-table')
      doc.getElementById('create-individual-link').setAttribute('disabled', 'disabled')
    } else {
      removeElements.push('individual-container')
    }
    if (req.data.company && req.data.company.length) {
      dashboard.HTML.renderTable(doc, req.data.company, 'stripe-account-row', 'company-accounts-table')
    } else {
      removeElements.push('company-container')
    }
    removeElements.push('no-stripe-accounts')
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `account-status-${stripeAccount.id}`)
      }
      if (stripeAccount.metadata.submitted) {
        removeElements.push(`not-submitted-${stripeAccount.id}`)
      } else {
        removeElements.push(`submitted-${stripeAccount.id}`)
      }
      if (stripeAccount.business_type === 'individual') {
        removeElements.push(`business-name-${stripeAccount.id}`)
        if (stripeAccount.individual.first_name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`individual-name-${stripeAccount.id}`)
        }
      } else {
        removeElements.push(`individual-name-${stripeAccount.id}`)
        if (stripeAccount.company.name) {
          removeElements.push(`blank-name-${stripeAccount.id}`)
        } else {
          removeElements.push(`business-name-${stripeAccount.id}`)
        }
      }
    }
  } else {
    removeElements.push('individual-container', 'company-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
