const connect = require('../../../../index.js')
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
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount', req.language)
  navbar.setup(doc, req.data.stripeAccount)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const removeList = []
  // only countries with country specs have containers for
  // their banking field format, but during tests the list
  // of country specs may be replaced with a single country
  // so the full, non-stripe country list is used here
  for (const country of connect.countryList) {
    if (country.code !== req.data.stripeAccount.country) {
      if (req.route.html.indexOf(`${country.code}-container`) > -1) {
        removeList.push(`${country.code}-container`)
      }
    }
  }
  const countries = []
  for (const country of connect.countrySpecs) {
    countries.push({
      object: 'country',
      code: country.id,
      name: connect.countryNameIndex[country.id]
    })
  }
  dashboard.HTML.renderList(doc, countries, 'country-option', 'country')
  const currencies = connect.countryCurrencyIndex[req.data.stripeAccount.country]
  dashboard.HTML.renderList(doc, currencies, 'currency-option', 'currency')
  if (req.body) {
    for (const field in req.body) {
      const element = doc.getElementById(field)
      if (!element) {
        continue
      }
      if (element.tag === 'input') {
        if (element.attr &&
          (element.attr.type === 'checkbox' || element.attr.type === 'radio')) {
          element.setAttribute('checked', 'checked')
        } else {
          element.setAttribute('value', (req.body[field] || '').split("'").join('&quot;'))
        }
      } else if (element.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, field, req.body[field] || '')
      }
    }
  }
  for (const id of removeList) {
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
  try {
    await global.api.user.connect.UpdatePaymentInformation.patch(req)
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
