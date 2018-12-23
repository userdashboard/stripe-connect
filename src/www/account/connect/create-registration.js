const countriesIndex = require('../../../../countries-index.json')
const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (req.session.lockURL === req.url && req.session.unlocked) {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    try {
      const stripeAccount = await global.api.user.connect.CreateStripeAccount.post(req)
      req.data = { stripeAccount }
      return
    } catch (error) {
      req.error = error.message
    }
  }
  const countrySpecs = await global.api.user.connect.CountrySpecs.get(req)
  const countries = []
  for (const countrySpec of countrySpecs) {
    countries.push({
      object: 'country',
      code: countrySpec.id,
      name: countriesIndex[countrySpec.id]
    })
  }
  req.data = { countries }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL) {
      return dashboard.Response.redirect(req, res, req.query.returnURL)
    }
    return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.data.stripeAccount.id}`)
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'country')
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.country) {
    return renderPage(req, res, 'invalid-country')
  }
  try {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    const stripeAccount = await global.api.user.connect.CreateStripeAccount.post(req)
    if (req.success) {
      req.stripeAccount = stripeAccount
      return renderPage(req, res, 'success')
    }
    return dashboard.Response.redirect(req, res, '/account/authorize')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
