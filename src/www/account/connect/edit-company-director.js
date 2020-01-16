const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.personid) {
    throw new Error('invalid-personid')
  }
  const director = await global.api.user.connect.CompanyDirector.get(req)
  director.stripePublishableKey = global.stripePublishableKey
  req.query.stripeid = director.account
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.business_type === 'individual') {
    throw new Error('invalid-stripe-account')
  }
  if (stripeAccount.company && stripeAccount.company.directors_provided) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { director, stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const removeElements = []
  const doc = dashboard.HTML.parse(req.route.html, req.data.director, 'person')
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'client-v3', 'connect-v3', 'handler-v3')
  } else {
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline' 'unsafe-eval'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      removeElements.push('form-container')
      for (const id of removeElements) {
        const element = doc.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.director.id}.relationship.title`) === -1) {
    removeElements.push('relationship_title-container')
  }
  if (req.data.stripeAccount.requirements.currently_due.indexOf(`${req.data.director.id}.email`) === -1) {
    removeElements.push('email')
  }
  if (req.method === 'GET') {
    for (const field of req.data.stripeAccount.requirements.currently_due) {
      if (field === 'verification.document' ||
          field === 'verification.additional_document') {
        continue
      }
      const posted = field.split('.').join('_')
      const element = doc.getElementById(posted)
      if (element) {
        element.setAttribute('value', req.data.director[field])
      }
    }
  } else {
    for (const field in req.body) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      element.setAttribute('value', req.body[field])
    }
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
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (global.stripeJS === 3 && !req.body.token) {
    return renderPage(req, res, 'invalid-token')
  }
  for (const field of req.data.stripeAccount.requirements.currently_due) {
    const posted = field.split('.').join('_')
    if (!field) {
      if (field === 'verification.document' ||
          field === 'verification.additional_document' ||
          field === 'relationship_title') {
        continue
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  try {
    await global.api.user.connect.UpdateCompanyDirector.patch(req)
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
