const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.directorid) {
    throw new Error('invalid-directorid')
  }
  const director = await global.api.user.connect.CompanyDirector.get(req)
  req.query.stripeid = director.stripeid
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  req.query.country = stripeAccount.country
  req.data = { director }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.director, 'director')
  return dashboard.Response.end(req, res, doc)
}
