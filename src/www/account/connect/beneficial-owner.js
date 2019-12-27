const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  const owner = await global.api.user.connect.BeneficialOwner.get(req)
  req.query.stripeid = owner.stripeid
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { owner }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.owner, 'owner')
  return dashboard.Response.end(req, res, doc)
}
