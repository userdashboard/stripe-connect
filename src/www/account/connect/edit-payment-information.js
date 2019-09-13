const countriesIndex = require('../../../../countries-index.json')
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
  const stripeCountries = await global.api.user.connect.CountrySpecs.get(req)
  let countrySpec
  for (const country of stripeCountries) {
    country.name = countriesIndex[country.id]
    if (country.id === stripeAccount.country) {
      countrySpec = country
    }
  }
  if (!countrySpec) {
    throw new Error(`invalid-country-${stripeAccount.country}`)
  }
  const currencies = []
  for (const currency in countrySpec.supported_bank_account_currencies) {
    currencies.push({ name: currency.toUpperCase(), currency, object: 'currency' })
  }
  const countries = []
  for (const country of stripeCountries) {
    countries.push({ name: countriesIndex[country.id], code: country.id, object: 'country' })
  }
  req.data = { stripeAccount, stripeCountries, countries, currencies, countrySpec }
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
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')

  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const selectedCountry = req.body ? req.body.country : req.data.countrySpec.id
  for (const country of req.data.stripeCountries) {
    if (country.id !== selectedCountry) {
      const countryContainer = doc.getElementById(`${country.id}-container`)
      if (countryContainer) {
        countryContainer.parentNode.removeChild(countryContainer)
      }
    }
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'country')
  dashboard.HTML.renderList(doc, req.data.currencies, 'currency-option', 'currency')
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
          element.setAttribute('value', req.body[field] || '')
        }
      } else if (element.tag === 'select') {
        dashboard.HTML.setSelectedOptionByValue(doc, field, req.body[field] || '')
      }
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.UpdatePaymentInformation.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
