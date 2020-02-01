const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (!stripeAccount) {
    throw new Error('invalid-stripeid')
  }
  if (stripeAccount.business_type !== 'company') {
    throw new Error('invalid-stripe-account')
  }
  if (!stripeAccount.company.owners_provided && 
    stripeAccount.requirements.currently_due.indexOf('relationship.owner') === -1) {
   throw new Error('invalid-stripe-account')
  }
  const owners = await global.api.user.connect.BeneficialOwners.get(req)
  req.data = { stripeAccount, owners }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  if (req.data.stripeAccount.company.owners_provided) {
    const ownerContainer = doc.getElementById('owners-container')
    ownerContainer.parentNode.removeChild(ownerContainer)
  } else {
    const submittedContainer = doc.getElementById('submitted-container')
    submittedContainer.parentNode.removeChild(submittedContainer)
    if (req.data.owners && req.data.owners.length) {
      dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
    } else {
      const ownersTable = doc.getElementById('owners-table')
      ownersTable.parentNode.removeChild(ownersTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
