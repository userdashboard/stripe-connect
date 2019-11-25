const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.ownerid) {
    throw new Error('invalid-ownerid')
  }
  const owner = await global.api.user.connect.BeneficialOwner.get(req)
  owner.stripePublishableKey = global.stripePublishableKey
  req.query.stripeid = owner.stripeid
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted) {
    throw new Error('invalid-stripe-account')
  }
  req.data = { owner }
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
  const doc = dashboard.HTML.parse(req.route.html, req.data.owner, 'owner')
  if (global.stripeJS !== 3) {
    const stripeJS = doc.getElementById('stripe-v3')
    stripeJS.parentNode.removeChild(stripeJS)
    const clientJS = doc.getElementById('client-v3')
    clientJS.parentNode.removeChild(clientJS)
    const connectJS = doc.getElementById('connect-v3')
    connectJS.parentNode.removeChild(connectJS)
    const handlerJS = doc.getElementById('handler-v3')
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
      const submitForm = doc.getElementById('form-container')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const selectedCountry = req.body ? req.body.relationship_owner_address_country || req.data.owner.relationship_owner_address_country : req.data.owner.relationship_owner_address_country
  const states = connect.countryDivisions[selectedCountry]
  dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_owner_address_state')
  const country = doc.getElementById('relationship_owner_address_country')
  dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'relationship_owner_address_country')
  dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', selectedCountry)
  if (req.method === 'GET') {
    for (const field of ['first_name', 'last_name', 'dob_day', 'dob_month', 'dob_year', 'id_number', 'address_line1', 'address_line2', 'address_city', 'address_postal_code']) {
      const element = doc.getElementById(`relationship_owner_${field}`)
      element.setAttribute('value', req.data.owner[field])
    }
    if (req.data.owner.relationship_owner_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_state', req.data.owner.relationship_owner_address_state)
    }
    dashboard.HTML.setSelectedOptionByValue(doc, country, req.data.owner.relationship_owner_address_country)
  } else if (req.body) {
    for (const fieldName in req.body) {
      const el = doc.getElementById(fieldName)
      if (!el) {
        continue
      }
      switch (el.tag) {
        case 'select':
          dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[fieldName])
          continue
        case 'input':
          if (el.attr.type === 'radio') {
            el.attr.checked = 'checked'
          } else {
            el.attr.value = req.body[fieldName]
          }
          continue
      }
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!req.body.relationship_owner_address_city) {
    return renderPage(req, res, 'invalid-relationship_owner_address_city')
  }
  if (!req.body.relationship_owner_address_country) {
    return renderPage(req, res, 'invalid-relationship_owner_address_country')
  }
  if (!req.body.relationship_owner_address_line1) {
    return renderPage(req, res, 'invalid-relationship_owner_address_line1')
  }
  if (!req.body.relationship_owner_address_postal_code) {
    return renderPage(req, res, 'invalid-relationship_owner_address_postal_code')
  }
  if (!req.body.relationship_owner_dob_day) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_day')
  }
  if (!req.body.relationship_owner_dob_month) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_month')
  }
  if (!req.body.relationship_owner_dob_year) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_year')
  }
  if (!req.body.relationship_owner_first_name) {
    return renderPage(req, res, 'invalid-relationship_owner_first_name')
  }
  if (!req.body.relationship_owner_last_name) {
    return renderPage(req, res, 'invalid-relationship_owner_last_name')
  }
  try {
    await global.api.user.connect.UpdateBeneficialOwner.patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
