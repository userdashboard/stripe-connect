const countriesIndex = require('../../../../countries-index.json')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  const countrySpecs = await global.api.user.connect.CountrySpecs.get(req)
  const countries = []
  for (const countrySpec of countrySpecs) {
    countries.push({
      object: 'country',
      code: countrySpec.id,
      name: countriesIndex[countrySpec.id]
    })
  }
  countries.sort((a, b) => {
    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  })
  req.data = { countries }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
    return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.data.stripeAccount.id}`)
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html)
  if (req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3F')}`
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.method === 'GET' && req.query && req.query.type) {
    if (req.query.type === 'company') {
      const company = doc.getElementById('company')
      company.setAttribute('checked', 'checked')
    } else if (req.query.type === 'individual') {
      const individual = doc.getElementById('individual')
      individual.setAttribute('checked', 'checked')
    }
  }
  if (req.method === 'GET' && req.country) {
    for (const country of req.data.countries) {
      if (country.id === req.country.id) {
        await dashboard.HTML.setSelectedOptionByValue(doc, 'country', req.country.id)
        break
      }
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
      req.data = { stripeAccount }
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
