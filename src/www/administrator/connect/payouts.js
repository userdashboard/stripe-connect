const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.connect.PayoutsCount.get(req)
  const payouts = await global.api.administrator.connect.Payouts.get(req)
  if (payouts && payouts.length) {
    for (const payout of payouts) {
      payout.createdFormatted = dashboard.Format.date(payout.created)
      payout.amountFormatted = dashboard.Format.money(payout.amount, payout.currency)
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { payouts, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html)
  if (req.data.payouts && req.data.payouts.length) {
    dashboard.HTML.renderTable(doc, req.data.payouts, 'payout-row', 'payouts-table')
    if (req.data.total <= global.PAGE_SIZE) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noPayouts = doc.getElementById('no-payouts')
    noPayouts.parentNode.removeChild(noPayouts)
  } else {
    const payoutsTable = doc.getElementById('payouts-table')
    payoutsTable.parentNode.removeChild(payoutsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
