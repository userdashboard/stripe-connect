const dashboard = require('@userdashboard/dashboard')

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
  let owners, directors, representatives
  req.query.all = true
  const persons = await global.api.user.connect.Persons.get(req)
  if (persons && persons.length) {
    for (const person of persons) {
      if (person.relationship.representative) {
        representatives = representatives || []
        representatives.push(person)
      }
      if (person.relationship.owner) {
        owners = owners || []
        owners.push(person)
      }
      if (person.relationship.director) {
        directors = directors || []
        directors.push(person)
      }
    }
  }
  req.data = { stripeAccount, owners, directors, representatives }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (!req.data.owners || !req.data.owners.length) {
    const ownerContainer = doc.getElementById('owners-container')
    ownerContainer.parentNode.removeChild(ownerContainer)
  } else {
    dashboard.HTML.renderTable(doc, req.data.owners, 'person-row', 'owners-table')
  }
  if (!req.data.representatives || !req.data.representatives.length) {
    const ownerContainer = doc.getElementById('owners-container')
    ownerContainer.parentNode.removeChild(ownerContainer)
  } else {
    dashboard.HTML.renderTable(doc, req.data.representatives, 'person-row', 'representatives-table')
  }
  if (!req.data.directors || !req.data.directors.length) {
    const directorContainer = doc.getElementById('directors-container')
    directorContainer.parentNode.removeChild(directorContainer)
  } else {
    dashboard.HTML.renderTable(doc, req.data.directors, 'person-row', 'directors-table')
  }
  return dashboard.Response.end(req, res, doc)
}
