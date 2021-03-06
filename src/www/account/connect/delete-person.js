const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-person.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  if (req.query.message === 'success') {
    req.data = {
      person: {
        id: '',
        object: 'person',
        relationship: {},
        requirements: {
          currently_due: []
        }
      }
    }
    return
  }
  const person = await global.api.user.connect.Person.get(req)
  req.query.stripeid = person.account
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.company && stripeAccount.company.persons_provided) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { person, stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.person, 'person')
  await navbar.setup(doc, req.data.person)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.user.connect.DeletePerson.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?personid=${req.query.personid}&message=success`
    })
    return res.end()
  }
}
