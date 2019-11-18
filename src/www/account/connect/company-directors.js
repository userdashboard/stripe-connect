const connect = require('../../../../index.js')
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
  if (!connect.euCountries[stripeAccount.country.toUpperCase()]) {
    throw new Error('invalid-stripe-account')
  }
  const directors = await global.api.user.connect.CompanyDirectors.get(req)
  req.data = { stripeAccount, directors }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  if (req.data.stripeAccount.metadata.submitted) {
    const directorContainer = doc.getElementById('directors-container')
    directorContainer.parentNode.removeChild(directorContainer)
  } else {
    const submittedContainer = doc.getElementById('submitted-container')
    submittedContainer.parentNode.removeChild(submittedContainer)
    if (req.data.directors && req.data.directors.length) {
      dashboard.HTML.renderTable(doc, req.data.directors, 'director-row', 'directors-table')
    } else {
      const directorsTable = doc.getElementById('directors-table')
      directorsTable.parentNode.removeChild(directorsTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
