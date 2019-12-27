const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

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
  if (stripeAccount.metadata.submitted ||
    stripeAccount.business_type === 'individual' ||
    stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  const countrySpec = connect.countrySpecIndex[stripeAccount.country]
  if (countrySpec.verification_fields.company.minimum.indexOf('relationship.director') === -1) {
    throw new Error('invalid-stripe-account')
  }
  const directors = await global.api.user.connect.CompanyDirectors.get(req)
  req.data = { stripeAccount, directors }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
    }
  }
  const removeElements = []
  req.data.stripeAccount.stripePublishableKey = global.stripePublishableKey
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
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
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyDirectorTemplate)
  if (requirements.currently_due.indexOf('relationship.director.relationship_title') === -1) {
    removeElements.push('relationship_title-container')
  }
  if (requirements.currently_due.indexOf('relationship.director.email') === -1) {
    removeElements.push('email')
  }
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
  if (req.body) {
    for (const fieldName in req.body) {
      const el = doc.getElementById(fieldName)
      if (!el) {
        continue
      }
      el.attr.value = req.body[fieldName]
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
  if (global.stripeJS === 3 && !req.body.token) {
    return renderPage(req, res, 'invalid-token')
  }
  const requirements = JSON.parse(req.data.stripeAccount.metadata.companyDirectorTemplate)
  for (const field of requirements.currently_due) {
    const posted = field.split('.').join('_')
    if (!field) {
      if (field === 'relationship.director.verification.front' ||
          field === 'relationship.director.verification.back') {
        continue
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  if (req.data && req.data.directors && req.data.directors.length) {
    for (const director of req.data.directors) {
      if (director.first_name === req.body.first_name &&
        director.last_name === req.body.last_name) {
        return renderPage(req, res, 'duplicate-name')
      }
    }
  }
  try {
    const director = await global.api.user.connect.CreateCompanyDirector.post(req)
    if (req.success) {
      req.data.director = director
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
