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
  if (connect.euCountries.indexOf(stripeAccount.country) === -1) {
    throw new Error('invalid-stripe-account')
  }
  const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
  req.data = { stripeAccount, directors }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
    }
  }
  req.data.stripeAccount.stripePublishableKey = global.stripePublishableKey
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (global.stripeJS !== 3) {
    const stripeJS = doc.getElementById('stripe-v3')
    stripeJS.parentNode.removeChild(stripeJS)
    const clientJS = doc.getElementById('client-v3')
    clientJS.parentNode.removeChild(clientJS)
    const connectJS = doc.getElementById('connect-js')
    connectJS.parentNode.removeChild(connectJS)
    const handlerJS = doc.getElementById('handler-js')
    handlerJS.parentNode.removeChild(handlerJS)
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
  console.log(req.body)
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!req.body.relationship_director_first_name) {
    return renderPage(req, res, 'invalid-relationship_director_first_name')
  }
  if (!req.body.relationship_director_last_name) {
    return renderPage(req, res, 'invalid-relationship_director_last_name')
  }
  if (req.data && req.data.directors && req.data.directors.length) {
    for (const director of req.data.directors) {
      if (director.first_name === req.body.relationship_director_first_name &&
        director.last_name === req.body.relationship_director_last_name) {
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
