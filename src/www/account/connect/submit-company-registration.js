const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.business_type === 'individual' ||
      stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  if (stripeAccount.metadata.requiresOwners === 'true' && !stripeAccount.company.owners_provided) {
    req.error = req.error || 'invalid-beneficial-owners'
  }
  if (stripeAccount.metadata.requiresDirectors === 'true' && !stripeAccount.company.directors_provided) {
    req.error = req.error || 'invalid-company-directors'
  }
  req.query.all = true
  const persons = await global.api.user.connect.Persons.get(req)
  const owners = []
  const directors = []
  if (!persons || !persons.length) {
    req.error = req.error || 'invalid-company-representative'
  } else {
    for (const person of persons) {
      if (person.relationship.representative) {
        if (person.requirements.currently_due.length) {
          req.error = req.error || 'invalid-company-representative'
        }
      } else if (person.relationship.owner) {
        owners.push(person)
        if (person.requirements.currently_due.length) {
          req.error = req.error || 'invalid-beneficial-owners'
        }
      } else {
        directors.push(person)
        if (person.requirements.currently_due.length) {
          req.error = req.error || 'invalid-company-directors'
        }
      }
    }
  }
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data &&
                           stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.error = req.error || 'invalid-payment-details'
  }
  req.data = { stripeAccount, owners, directors }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || req.error || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || req.error) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  if (messageTemplate !== 'success' && req.data.owners && req.data.owners.length) {
    dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
  } else {
    const ownersContainer = doc.getElementById('owners-container')
    ownersContainer.parentNode.removeChild(ownersContainer)
  }
  if (messageTemplate !== 'success' && req.data.directors && req.data.directors.length) {
    dashboard.HTML.renderTable(doc, req.data.directors, 'director-row', 'directors-table')
  } else {
    const directorsContainer = doc.getElementById('directors-container')
    directorsContainer.parentNode.removeChild(directorsContainer)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.error) {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.SetCompanyRegistrationSubmitted.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?stripeid=${req.query.stripeid}&message=success`
    })
    return res.end()
  }
}
