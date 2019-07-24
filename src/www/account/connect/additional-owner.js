const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest(req) {
  if (!req.query || !req.query.ownerid) {
    throw new Error('invalid-ownerid')
  }
  const owner = await global.api.user.connect.AdditionalOwner.get(req)
  req.query.stripeid = owner.stripeid
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted || stripeAccount.metadata.submittedOwners) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  req.data = { owner }
}

async function renderPage(req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.owner, 'owner')
  navbar.setup(doc, req.data.owner)
  return dashboard.Response.end(req, res, doc)
}
