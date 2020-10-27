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
  if (req.query.message === 'success') {
    req.data = {
      stripeAccount: {
        object: 'account',
        id: req.query.stripeid,
        business_profile: {},
        company: {},
        individual: {},
        statusMessage: 'deleted'
      }
    }
    return
  }
  const stripeAccount = await global.api.administrator.connect.StripeAccount.get(req)
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.requirements.disabled_reason) {
    stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
  } else if (stripeAccount.requirements.details_code) {
    stripeAccount.statusMessage = stripeAccount.requirements.details_code
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  stripeAccount.individual = stripeAccount.individual || {}
  stripeAccount.company = stripeAccount.company || {}
  req.data = { stripeAccount }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.stripeAccount, 'stripeAccount', req.language)
  dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, 'account-status')
  const mccCodes = connect.getMerchantCategoryCodes(req.language)
  const mccDescription = doc.getElementById('mcc-description')
  for (const code of mccCodes) {
    if (code.code === req.data.stripeAccount.business_profile.mcc) {
      mccDescription.innerHTML = code.description
      break
    }
  }
  const removeElements = []
  if (req.data.stripeAccount.business_type === 'individual') {
    removeElements.push('business-name')
    if (req.data.stripeAccount.individual.first_name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('individual-name')
    }
  } else {
    removeElements.push('individual-name')
    if (req.data.stripeAccount.company.name) {
      removeElements.push('blank-name')
    } else {
      removeElements.push('business-name')
    }
  }
  if (messageTemplate) {
    if (messageTemplate === 'success') {
      removeElements.push('submit-form', 'stripe-accounts-table')
    }
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.connect.DeleteStripeAccount.delete(req)
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
