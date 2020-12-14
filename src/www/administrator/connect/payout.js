const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.payoutid) {
    throw new Error('invalid-payoutid')
  }
  const payout = await global.api.administrator.connect.Payout.get(req)
  payout.createdFormatted = dashboard.Format.date(payout.created)
  payout.amountFormatted = dashboard.Format.money(payout.amount, payout.currency)
  req.data = { payout }
}

async function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.payout, 'payout')
  if (req.data.payout.failure_code) {
    dashboard.HTML.renderTemplate(doc, null, req.data.payout.failure_code, `status-${req.data.payout.id}`)
  }
  return dashboard.Response.end(req, res, doc)
}
