const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  get: renderPage,
  post: submitForm
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
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
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
  dashboard.HTML.renderList(doc, connect.countrySpecs, 'country-option', 'country')
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!req.body.country) {
    return renderPage(req, res, 'invalid-country')
  }
  const found = connect.countrySpecIndex[req.body.country] && connect.countrySpecIndex[req.body.country].object
  if (!found) {
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
