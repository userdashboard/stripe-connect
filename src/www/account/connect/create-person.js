const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-persons.js')

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
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || req.query.message
  const removeElements = []
  req.data.stripeAccount.stripePublishableKey = global.stripePublishableKey
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  await navbar.setup(doc, req.data.stripeAccount)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      removeElements.push('submit-form')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.metadata.requiresDirectors === 'false') {
    removeElements.push('director-container')
  }
  if (req.data.stripeAccount.metadata.requiresOwners === 'false') {
    removeElements.push('owner-container')
  }
  if (req.body) {
    for (const fieldName in req.body) {
      const el = doc.getElementById(fieldName)
      if (!el) {
        continue
      }
      el.attr.value = req.body[fieldName]
    }
  } else if (req.query.relationship_director) {
    doc.getElementById('relationship_director').setAttribute('checked', true)
  } else if (req.query.relationship_owner) {
    doc.getElementById('relationship_owner').setAttribute('checked', true)
  } else if (req.query.relationship_representative) {
    doc.getElementById('relationship_representative').setAttribute('checked', true)
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.relationship_title || !req.body.relationship_title.length) {
    return renderPage(req, res, 'invalid-relationship_title')
  }
  if (req.body.relationship_percent_ownership) {
    let percent
    try {
      percent = parseFloat(req.body.relationship_percent_ownership, 10)
    } catch (s) {
      return renderPage(req, res, 'invalid-relationship_percent_ownership')
    }
    if ((!percent && percent !== 0) || percent > 100 || percent < 0) {
      return renderPage(req, res, 'invalid-relationship_percent_ownership')
    }
  }
  if (req.body.relationship_representative !== 'true' &&
      req.body.relationship_director !== 'true' &&
      req.body.relationship_owner !== 'true') {
    return renderPage(req, res, 'invalid-selection')
  }
  if (req.body.relationship_director === 'true' && req.data.stripeAccount.metadata.requiresDirectors === 'false') {
    return renderPage(req, res, 'invalid-director')
  }
  if (req.body.relationship_owner === 'true' && req.data.stripeAccount.metadata.requiresOwners === 'false') {
    return renderPage(req, res, 'invalid-owner')
  }
  let person
  try {
    person = await global.api.user.connect.CreatePerson.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/account/connect/person?personid=${person.id}`
    })
    return res.end()
  }
}
