const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-person.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  const person = await global.api.user.connect.Person.get(req)
  req.data = { person }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.person, 'person')
  await navbar.setup(doc, req.data.person)
  return dashboard.Response.end(req, res, doc)
}
