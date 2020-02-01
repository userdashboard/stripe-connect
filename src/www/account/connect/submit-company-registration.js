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
  if (stripeAccount.requirements.currently_due.indexOf('relationship.owner') > -1 && !stripeAccount.company.owners_provided) {
    req.error = req.error || 'invalid-beneficial-owners'
  }
  if (stripeAccount.requirements.currently_due.indexOf('relationship.director') > -1 && !stripeAccount.company.directors_provided) {
    req.error = req.error || 'invalid-company-directors'
  }
  const representative = await global.api.user.connect.CompanyRepresentative.get(req)
  if (!representative) {
    req.error = req.error || 'invalid-company-representative'
  }
  for (const requirement of stripeAccount.requirements.currently_due) {
    if (requirement.startsWith(representative.id)) {
      req.error = req.error || 'invalid-company-representative'
      break
    }
  }
  const completedPayment = stripeAccount.external_accounts &&
                           stripeAccount.external_accounts.data &&
                           stripeAccount.external_accounts.data.length
  if (!completedPayment) {
    req.error = req.error || 'invalid-payment-details'
  }
  const owners = await global.api.user.connect.BeneficialOwners.get(req)
  const directors = await global.api.user.connect.CompanyDirectors.get(req)
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
