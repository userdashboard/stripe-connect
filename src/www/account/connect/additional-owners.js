const dashboard = require('@userappstore/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (stripeAccount.individual ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec._get(req)
  if (countrySpec.verification_fields.company.minimum.indexOf('legal_entity.additional_owners') === -1 &&
    countrySpec.verification_fields.company.additional.indexOf('legal_entity.additional_owners') === -1) {
    throw new Error('invalid-stripe-account')
  }
  const owners = await global.api.user.connect.AdditionalOwners._get(req)
  req.data = { stripeAccount, owners, countrySpec }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (req.data.stripeAccount.metadata.submittedOwners) {
    dashboard.HTML.renderTemplate(doc, null, 'submitted-owners', 'message-container')
    const noOwners = doc.getElementById('no-owners')
    noOwners.parentNode.removeChild(noOwners)
    const ownersTable = doc.getElementById('owners-table')
    ownersTable.parentNode.removeChild(ownersTable)
  } else {
    if (req.data.owners && req.data.owners.length) {
      dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
      const noOwners = doc.getElementById('no-owners')
      noOwners.parentNode.removeChild(noOwners)
    } else {
      const ownersTable = doc.getElementById('owners-table')
      ownersTable.parentNode.removeChild(ownersTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
