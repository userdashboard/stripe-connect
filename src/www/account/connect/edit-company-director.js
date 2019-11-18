const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.directorid) {
    throw new Error('invalid-directorid')
  }
  const director = await global.api.user.connect.CompanyDirector.get(req)
  director.stripePublishableKey = global.stripePublishableKey
  req.query.stripeid = director.stripeid
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { director, stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  
  const doc = dashboard.HTML.parse(req.route.html, req.data.director, 'director')
  if (global.stripeJS !== 3) {
    const stripeJS = doc.getElementById('stripe-v3')
    stripeJS.parentNode.removeChild(stripeJS)
    const clientJS = doc.getElementById('client-v3')
    clientJS.parentNode.removeChild(clientJS)
    const connectJS = doc.getElementById('connect-js')
    connectJS.parentNode.removeChild(connectJS)
  } else {
    res.setHeader('content-security-policy',
    'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/stripe-helper.js 'unsafe-inline' 'unsafe-eval'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (!req.body) {
    for (const field of ['first_name', 'last_name']) {
      const element = doc.getElementById(`relationship_director_${field}`)
      element.setAttribute('value', req.data.director[field])
    }
    return dashboard.Response.end(req, res, doc)
  }
  for (const fieldName in req.body) {
    const el = doc.getElementById(fieldName)
    if (!el) {
      continue
    }
    el.attr.value = req.body[fieldName]
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!req.body.relationship_director_first_name) {
    return renderPage(req, res, 'invalid-relationship_director_first_name')
  }
  if (!req.body.relationship_director_last_name) {
    return renderPage(req, res, 'invalid-relationship_director_last_name')
  }
  try {
    await global.api.user.connect.UpdateCompanyDirector.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
